import { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react';
import { MDConnection } from '@motherduck/wasm-client';
import { MOTHERDUCK_TOKEN } from '@/config/motherduck';

interface MDConnectionContextType {
  connection: MDConnection | null;
  ready: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const MDConnectionContext = createContext<MDConnectionContextType | undefined>(undefined);

export const useMDConnectionContext = () => {
  const context = useContext(MDConnectionContext);
  if (!context) {
    throw new Error('useMDConnectionContext must be used within MDConnectionProvider');
  }
  return context;
};

interface MDConnectionProviderProps {
  children: ReactNode;
}

export const MDConnectionProvider = ({ children }: MDConnectionProviderProps) => {
  const [connection, setConnection] = useState<MDConnection | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (isConnecting || ready) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      console.log('Connecting to MotherDuck...');
      const conn = MDConnection.create({
        mdToken: MOTHERDUCK_TOKEN,
      });
      
      await conn.isInitialized();
      console.log('MotherDuck initialized');
      
      setConnection(conn);
      setReady(true);
      console.log('MotherDuck connection ready');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('MotherDuck connection error:', err);
      setError(errorMessage);
      setReady(false);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, ready]);

  const disconnect = useCallback(async () => {
    if (connection) {
      try {
        await connection.close();
        console.log('MotherDuck connection closed');
      } catch (err) {
        console.error('Error closing connection:', err);
      }
      setConnection(null);
      setReady(false);
    }
  }, [connection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connection) {
        connection.close().catch(console.error);
      }
    };
  }, [connection]);

  return (
    <MDConnectionContext.Provider value={{ connection, ready, error, connect, disconnect }}>
      {children}
    </MDConnectionContext.Provider>
  );
};
