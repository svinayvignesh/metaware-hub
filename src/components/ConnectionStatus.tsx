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

  if (isConnected && !lastError) {
    return null;
  }

  return (
    <>
      <style>{`
        .connection-alert {
          margin-bottom: 1rem;
        }

        .connection-content {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .connection-icon {
          height: 1.25rem;
          width: 1.25rem;
          margin-top: 0.125rem;
        }

        .connection-text {
          flex: 1;
        }

        .connection-button {
          margin-top: 0.75rem;
        }

        .connection-button-icon {
          height: 1rem;
          width: 1rem;
          margin-right: 0.5rem;
        }

        .connection-button-icon-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <Alert variant={isConnected ? "default" : "destructive"} className="connection-alert">
        <div className="connection-content">
          {isConnected ? (
            <CheckCircle2 className="connection-icon" />
          ) : (
            <AlertCircle className="connection-icon" />
          )}
          <div className="connection-text">
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
                className="connection-button"
              >
                <RefreshCw className={`connection-button-icon ${isChecking ? 'connection-button-icon-spin' : ''}`} />
                {isChecking ? 'Checking...' : 'Retry Connection'}
              </Button>
            )}
          </div>
        </div>
      </Alert>
    </>
  );
}