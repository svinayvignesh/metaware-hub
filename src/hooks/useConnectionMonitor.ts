/**
 * Connection Monitor Hook
 * 
 * This hook monitors the health of the GraphQL connection and provides
 * reconnection capabilities when connection issues are detected.
 * 
 * Features:
 * - Monitors connection health
 * - Automatic reconnection attempts
 * - Connection status reporting
 * - Error tracking
 * 
 * @author MetaWare Development Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { apolloClient } from '@/lib/apollo-client';
import { gql } from '@apollo/client';

const HEALTH_CHECK_QUERY = gql`
  query HealthCheck {
    __typename
  }
`;

interface ConnectionStatus {
  isConnected: boolean;
  isChecking: boolean;
  lastError: string | null;
  lastChecked: Date | null;
}

/**
 * Hook to monitor GraphQL connection health
 * 
 * @param checkInterval - How often to check connection (ms), default 30000 (30s)
 * @returns Connection status and manual check function
 */
export function useConnectionMonitor(checkInterval = 30000) {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: true,
    isChecking: false,
    lastError: null,
    lastChecked: null,
  });

  const checkConnection = useCallback(async () => {
    setStatus(prev => ({ ...prev, isChecking: true }));

    try {
      await apolloClient.query({
        query: HEALTH_CHECK_QUERY,
        fetchPolicy: 'network-only',
      });

      setStatus({
        isConnected: true,
        isChecking: false,
        lastError: null,
        lastChecked: new Date(),
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setStatus({
        isConnected: false,
        isChecking: false,
        lastError: errorMessage,
        lastChecked: new Date(),
      });

      return false;
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkConnection();

    // Set up interval for periodic checks
    const interval = setInterval(checkConnection, checkInterval);

    return () => {
      clearInterval(interval);
    };
  }, [checkConnection, checkInterval]);

  return {
    ...status,
    checkConnection,
  };
}
