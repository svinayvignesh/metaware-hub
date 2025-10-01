import { useState, useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
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
  onSave: (selectedMetas: MetaField[]) => void;
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
  const [metaFields, setMetaFields] = useState<MetaField[]>([]);

  const [fetchMeta, { loading, data, error }] = useLazyQuery(GET_META_FOR_ENTITY);

  useEffect(() => {
    if (data?.meta_meta) {
      console.log("Fetched meta fields:", data.meta_meta);
      setMetaFields(data.meta_meta);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      console.error("Error fetching meta:", error);
      toast({
        title: "Error",
        description: "Failed to fetch metadata fields",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedMetas(new Set());
      setMetaFields([]);
      console.log("Opening modal, fetching meta for entity:", entityId);
      fetchMeta({ variables: { enid: entityId } });
    }
    onOpenChange(newOpen);
  };

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
    const selected = metaFields.filter((meta) => selectedMetas.has(meta.id));
    onSave(selected);
    onOpenChange(false);
  };

  const availableFields = metaFields.filter(
    (meta) => !alreadySelectedIds.has(meta.id)
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Glossary Meta</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : availableFields.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No additional metadata fields available
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3">
              {availableFields.map((meta) => (
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
            disabled={selectedMetas.size === 0 || loading}
          >
            Add Selected ({selectedMetas.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
