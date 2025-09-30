import { useState, useEffect, useCallback, useRef } from 'react';
import { MDConnection } from '@motherduck/wasm-client';
import { MOTHERDUCK_TOKEN, MOTHERDUCK_DATABASE, MOTHERDUCK_SCHEMA } from '@/config/motherduck';
import { toast } from '@/hooks/use-toast';

interface UseMDConnectionReturn {
  connection: MDConnection | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  ready: boolean;
  error: string | null;
}

let globalConnection: MDConnection | null = null;
let isInitializing = false;

export function useMDConnection(): UseMDConnectionReturn {
  const [connection, setConnection] = useState<MDConnection | null>(globalConnection);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  const connect = useCallback(async () => {
    // Idempotent: return early if already connected
    if (globalConnection) {
      setConnection(globalConnection);
      setReady(true);
      return;
    }

    // Prevent concurrent initialization
    if (isInitializing) {
      return;
    }

    if (initRef.current) {
      return;
    }

    initRef.current = true;
    isInitializing = true;

    try {
      // Check token
      if (!MOTHERDUCK_TOKEN) {
        throw new Error('MOTHERDUCK_TOKEN is not configured');
      }

      // Create MotherDuck WASM connection
      const conn = MDConnection.create({
        mdToken: MOTHERDUCK_TOKEN,
      });

      // Wait for initialization to complete
      await conn.isInitialized();

      // Set default database and schema
      await conn.evaluateQuery(`USE ${MOTHERDUCK_DATABASE};`);
      await conn.evaluateQuery(`SET schema='${MOTHERDUCK_SCHEMA}';`);

      // Store globally
      globalConnection = conn;

      setConnection(conn);
      setReady(true);
      setError(null);

      toast({
        title: "Database Connected",
        description: "MotherDuck connection established successfully",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to MotherDuck';
      setError(errorMessage);
      setReady(false);
      
      toast({
        title: "Database Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      console.error('MotherDuck connection error:', err);
    } finally {
      isInitializing = false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (globalConnection) {
        await globalConnection.close();
        globalConnection = null;
      }
      setConnection(null);
      setReady(false);
      initRef.current = false;
    } catch (err) {
      console.error('Error disconnecting from MotherDuck:', err);
    }
  }, []);

  useEffect(() => {
    return () => {
      // Don't disconnect on unmount to maintain connection across components
    };
  }, []);

  return {
    connection,
    connect,
    disconnect,
    ready,
    error,
  };
}

export async function queryMDTable(
  connection: MDConnection,
  namespace: string,
  subjectarea: string,
  entity: string
): Promise<{ columns: string[]; rows: any[] }> {
  try {
    const query = `SELECT * FROM ${namespace}.${subjectarea}.${entity};`;
    const result = await connection.evaluateQuery(query);
    
    // Check if result is materialized
    if (result.type !== 'materialized') {
      throw new Error('Expected materialized result');
    }

    // Convert to rows using the data.toRows() method
    const rows = Array.from(result.data.toRows());

    if (rows.length === 0) {
      return { columns: [], rows: [] };
    }

    const columns = Object.keys(rows[0]);
    return { columns, rows };
  } catch (err) {
    console.error('Query error:', err);
    toast({
      title: "Query Failed",
      description: err instanceof Error ? err.message : 'Failed to execute query',
      variant: "destructive",
    });
    throw err;
  }
}
