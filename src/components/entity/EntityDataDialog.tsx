import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable } from "@/components/table/DataTable";
import { useMDConnection, queryMDTable } from "@/hooks/useMDConnection";
import { Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EntityDataDialogProps {
  entity: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EntityDataDialog({ entity, open, onOpenChange }: EntityDataDialogProps) {
  const { connection, connect, ready } = useMDConnection();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ columns: string[]; rows: any[] }>({ columns: [], rows: [] });

  useEffect(() => {
    if (open && !ready && !connection) {
      connect();
    }
  }, [open, ready, connection, connect]);

  useEffect(() => {
    if (open && ready && connection && entity) {
      fetchData();
    }
  }, [open, ready, connection, entity]);

  const fetchData = async () => {
    if (!connection || !entity) return;

    setLoading(true);
    try {
      const namespace = entity.subjectarea.namespace.name;
      const subjectarea = entity.subjectarea.name;
      const entityName = entity.name;

      const result = await queryMDTable(connection, namespace, subjectarea, entityName);
      setData(result);
    } catch (error) {
      console.error("Error fetching entity data:", error);
      setData({ columns: [], rows: [] });
    } finally {
      setLoading(false);
    }
  };

  const columns = data.columns.map((col) => ({
    key: col,
    title: col,
    type: "text" as const,
  }));

  return (
    <>
      <style>{`
        .entity-dialog-content {
          max-width: 95vw;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }

        .entity-dialog-header-icon {
          height: 1.25rem;
          width: 1.25rem;
          color: hsl(var(--primary));
        }

        .entity-dialog-subtitle {
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
        }

        .entity-dialog-body {
          flex: 1;
          overflow: hidden;
        }

        .entity-dialog-status {
          display: flex;
          align-items: center;
          justify-content: center;
          padding-top: 3rem;
          padding-bottom: 3rem;
        }

        .entity-dialog-status-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .entity-dialog-loader {
          height: 2rem;
          width: 2rem;
          animation: spin 1s linear infinite;
          margin-left: auto;
          margin-right: auto;
          color: hsl(var(--muted-foreground));
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .entity-dialog-status-text {
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
        }

        .entity-dialog-empty-icon {
          height: 3rem;
          width: 3rem;
          margin-left: auto;
          margin-right: auto;
          color: hsl(var(--muted-foreground));
          opacity: 0.5;
        }

        .entity-dialog-empty-text {
          color: hsl(var(--muted-foreground));
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="entity-dialog-content">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="entity-dialog-header-icon" />
              {entity?.name || "Entity Data"}
            </DialogTitle>
            <p className="entity-dialog-subtitle">
              {entity?.subjectarea?.namespace?.name}.{entity?.subjectarea?.name}
            </p>
          </DialogHeader>

          <div className="entity-dialog-body">
            {!ready ? (
              <div className="entity-dialog-status">
                <div className="entity-dialog-status-content">
                  <Loader2 className="entity-dialog-loader" />
                  <p className="entity-dialog-status-text">Connecting to database...</p>
                </div>
              </div>
            ) : loading ? (
              <div className="entity-dialog-status">
                <div className="entity-dialog-status-content">
                  <Loader2 className="entity-dialog-loader" />
                  <p className="entity-dialog-status-text">Loading data...</p>
                </div>
              </div>
            ) : data.rows.length === 0 ? (
              <div className="entity-dialog-status">
                <div className="entity-dialog-status-content">
                  <Database className="entity-dialog-empty-icon" />
                  <p className="entity-dialog-empty-text">No data found</p>
                  <Button variant="outline" size="sm" onClick={fetchData}>
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={data.rows}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}