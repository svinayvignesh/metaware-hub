import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { GET_META_FOR_ENTITY, type MetaField } from "@/graphql/queries/meta";

interface AddGlossaryMetaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  onSave: (selectedMetas: MetaField[], removedIds: string[]) => void;
  alreadySelectedIds: Set<string>;
}

export function AddGlossaryMetaModal({
  open,
  onOpenChange,
  entityId,
  onSave,
  alreadySelectedIds,
}: AddGlossaryMetaModalProps) {
  const { toast } = useToast();
  const [selectedMetas, setSelectedMetas] = useState<Set<string>>(new Set());

  console.log("🔍 Modal props:", { open, entityId, alreadySelectedIdsCount: alreadySelectedIds.size });

  const { data, loading, error, refetch } = useQuery(GET_META_FOR_ENTITY, {
    variables: { enid: entityId },
    skip: !open || !entityId,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      console.log("✅ Query completed successfully:", data);
    },
    onError: (error) => {
      console.error("❌ Query error:", error);
      toast({
        title: "Error",
        description: `Failed to fetch metadata fields: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const metaFields = data?.meta_meta || [];
  
  console.log("📊 Current state:", {
    open,
    loading,
    error: error?.message,
    metaFieldsCount: metaFields.length,
    metaFieldsData: metaFields,
    entityId
  });

  useEffect(() => {
    if (open) {
      console.log("🚀 Modal opened, initializing selectedMetas with:", Array.from(alreadySelectedIds));
      setSelectedMetas(new Set(alreadySelectedIds));
      
      if (!entityId) {
        console.error("❌ Entity ID is missing!");
        toast({
          title: "Error",
          description: "Entity ID is missing",
          variant: "destructive",
        });
      }
    }
  }, [open, entityId, alreadySelectedIds, toast]);

  const handleToggle = (metaId: string) => {
    setSelectedMetas((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(metaId)) {
        newSet.delete(metaId);
      } else {
        newSet.add(metaId);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    const newlySelected = metaFields.filter(
      (meta) => selectedMetas.has(meta.id) && !alreadySelectedIds.has(meta.id)
    );
    
    const removedIds = Array.from(alreadySelectedIds).filter(
      (id) => !selectedMetas.has(id)
    );
    
    onSave(newlySelected, removedIds);
    onOpenChange(false);
  };

  return (
    <>
      <style>{`
        .glossary-modal-content {
          max-width: 42rem;
        }

        .glossary-modal-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding-top: 2rem;
          padding-bottom: 2rem;
        }

        .glossary-modal-loader {
          height: 2rem;
          width: 2rem;
          animation: spin 1s linear infinite;
          color: hsl(var(--muted-foreground));
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .glossary-modal-empty {
          padding-top: 2rem;
          padding-bottom: 2rem;
          text-align: center;
          color: hsl(var(--muted-foreground));
        }

        .glossary-modal-scroll {
          max-height: 25rem;
          padding-right: 1rem;
        }

        .glossary-modal-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .glossary-modal-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
          transition: background-color 0.2s;
        }

        .glossary-modal-item:hover {
          background-color: hsl(var(--muted) / 0.5);
        }

        .glossary-modal-checkbox {
          margin-top: 0.25rem;
        }

        .glossary-modal-item-content {
          flex: 1;
        }

        .glossary-modal-item-name {
          font-weight: 500;
        }

        .glossary-modal-item-details {
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
        }

        .glossary-modal-item-description {
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
          margin-top: 0.25rem;
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glossary-modal-content">
          <DialogHeader>
            <DialogTitle>Add Glossary Meta</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="glossary-modal-loading">
              <Loader2 className="glossary-modal-loader" />
            </div>
          ) : metaFields.length === 0 ? (
            <div className="glossary-modal-empty">
              No metadata fields available
            </div>
          ) : (
            <ScrollArea className="glossary-modal-scroll">
              <div className="glossary-modal-list">
                {metaFields.map((meta) => (
                  <div
                    key={meta.id}
                    className="glossary-modal-item"
                  >
                    <Checkbox
                      checked={selectedMetas.has(meta.id)}
                      onCheckedChange={() => handleToggle(meta.id)}
                      className="glossary-modal-checkbox"
                    />
                    <div className="glossary-modal-item-content">
                      <div className="glossary-modal-item-name">{meta.name}</div>
                      <div className="glossary-modal-item-details">
                        {meta.alias} · {meta.type}
                      </div>
                      {meta.description && (
                        <div className="glossary-modal-item-description">
                          {meta.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}