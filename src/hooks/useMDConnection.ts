import { useState, useEffect, useCallback, useRef } from 'react';
import { MDConnection } from '@motherduck/wasm-client';
import { MOTHERDUCK_TOKEN } from '@/config/motherduck';
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

/** Returns true for any "object not found" DuckDB error (table, schema, catalog). */
function isObjectNotFoundError(message: string): boolean {
  return (
    (message.includes('Table with name') && message.includes('does not exist')) ||
    (message.includes('Catalog') && message.includes('does not exist')) ||
    (message.includes('Schema') && message.includes('does not exist')) ||
    message.includes('Binder Error')
  );
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
      // Table exists but is empty — get column names from schema
      try {
        const descResult = await connection.evaluateQuery(
          `DESCRIBE ${namespace}.${subjectarea}.${entity};`
        );
        if (descResult.type === 'materialized') {
          const descRows = Array.from(descResult.data.toRows()) as any[];
          const columns = descRows.map((r: any) => r.column_name ?? Object.values(r)[0] ?? '').filter(Boolean);
          return { columns, rows: [] };
        }
      } catch {
        // DESCRIBE failed — return with no columns
      }
      return { columns: [], rows: [] };
    }

    const columns = Object.keys(rows[0]);
    return { columns, rows };
  } catch (err) {
    console.error('Query error:', err);

    // Don't show toast for not-found errors — let the component handle them
    const errorMessage = err instanceof Error ? err.message : 'Failed to execute query';
    if (!isObjectNotFoundError(errorMessage)) {
      toast({
        title: "Query Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }

    throw err;
  }
}
