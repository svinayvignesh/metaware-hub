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

  // Use useQuery with skip to only fetch when modal is open
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

  // Initialize selected metas when modal opens
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
    // Find newly added items
    const newlySelected = metaFields.filter(
      (meta) => selectedMetas.has(meta.id) && !alreadySelectedIds.has(meta.id)
    );
    
    // Find removed items (were in alreadySelectedIds but not in selectedMetas)
    const removedIds = Array.from(alreadySelectedIds).filter(
      (id) => !selectedMetas.has(id)
    );
    
    onSave(newlySelected, removedIds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Glossary Meta</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : metaFields.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No metadata fields available
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3">
              {metaFields.map((meta) => (
                <div
                  key={meta.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedMetas.has(meta.id)}
                    onCheckedChange={() => handleToggle(meta.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{meta.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {meta.alias} · {meta.type}
                    </div>
                    {meta.description && (
                      <div className="text-sm text-muted-foreground mt-1">
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
  );
}
