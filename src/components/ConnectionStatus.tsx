/**
 * Connection Status Component
 * 
 * Displays the current connection status to the user and provides
 * manual reconnection options when issues are detected.
 * 
 * @author MetaWare Development Team
 * @version 1.0.0
 */

import { useConnectionMonitor } from '@/hooks/useConnectionMonitor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export function ConnectionStatus() {
  const { isConnected, isChecking, lastError, checkConnection } = useConnectionMonitor();

  // Don't show anything if connection is healthy
  if (isConnected && !lastError) {
    return null;
  }

  return (
    <Alert variant={isConnected ? "default" : "destructive"} className="mb-4">
      <div className="flex items-start gap-3">
        {isConnected ? (
          <CheckCircle2 className="h-5 w-5 mt-0.5" />
        ) : (
          <AlertCircle className="h-5 w-5 mt-0.5" />
        )}
        <div className="flex-1">
          <AlertTitle>
            {isConnected ? 'Connection Restored' : 'Connection Issue Detected'}
          </AlertTitle>
          <AlertDescription>
            {isConnected 
              ? 'Your connection to the database has been restored.'
              : lastError || 'Unable to connect to the database. This may be due to connection pool exhaustion.'}
          </AlertDescription>
          {!isConnected && (
            <Button
              onClick={checkConnection}
              disabled={isChecking}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Checking...' : 'Retry Connection'}
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}
