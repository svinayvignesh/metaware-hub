import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { rulesetAPI } from "@/services/api";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MappingEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  glossaryEntity: any;
  mappings: any[];
  onSuccess: () => void;
}

export function MappingEditorModal({
  open,
  onOpenChange,
  glossaryEntity,
  mappings,
  onSuccess,
}: MappingEditorModalProps) {
  const [editedMappings, setEditedMappings] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (mappings.length > 0) {
      setEditedMappings(mappings);
    }
  }, [mappings]);

  const handleMappingChange = (index: number, field: string, value: string) => {
    setEditedMappings(prev =>
      prev.map((mapping, i) =>
        i === index ? { ...mapping, [field]: value } : mapping
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Group mappings by source entity
      const mappingsBySource = (editedMappings || []).reduce<Record<string, any[]>>((acc, mapping) => {
        const sourceEnId = mapping.source_en_id;
        if (!acc[sourceEnId]) {
          acc[sourceEnId] = [];
        }
        acc[sourceEnId].push(mapping);
        return acc;
      }, {});

      // Create a ruleset for each source entity
      for (const [sourceEnId, sourceMappings] of Object.entries(mappingsBySource)) {
        const firstMapping = sourceMappings[0];
        
        const payload = {
          entity_core: {
            ns: glossaryEntity.subjectarea?.namespace?.name || "",
            sa: glossaryEntity.subjectarea?.name || "",
            en: glossaryEntity.name,
            ns_type: "glossary",
            ns_id: glossaryEntity.subjectarea?.namespace?.id || "",
            sa_id: glossaryEntity.sa_id,
            en_id: glossaryEntity.id,
          },
          ruleset_request: {
            id: `rs_${glossaryEntity.id}_${sourceEnId}_${Date.now()}`,
            type: "glossary_association",
            name: `${glossaryEntity.name} to ${firstMapping.source_en_name} mapping`,
            description: "Auto-generated mapping from standardized blueprint",
            view_name: "",
            target_en_id: glossaryEntity.id,
            source_id: `src_${sourceEnId}_${Date.now()}`,
            transform_id: `trns_${Date.now()}`,
            rule_requests: sourceMappings.map((mapping, index) => ({
              id: `rule_${mapping.glossary_meta_id}_${Date.now()}_${index}`,
              type: "transformation",
              subtype: "mapping",
              name: mapping.glossary_meta_name,
              alias: mapping.source_expression,
              description: `Mapping for ${mapping.glossary_meta_name}`,
              rule_status: "active",
              is_shared: false,
              rule_expression: mapping.source_expression,
              rule_priority: index,
              rule_category: "mapping",
              rule_tags: "",
              rule_params: "",
              color: "",
              language: "sql",
              fn_name: "",
              fn_package: "",
              fn_imports: "",
              update_strategy_: "I",
              meta_id: mapping.glossary_meta_id,
              meta: mapping.glossary_meta_name,
            })),
            ruleset_id: "",
          },
          source_request: {
            type: "DIRECT",
            source_ns: firstMapping.source_ns || "",
            source_sa: firstMapping.source_sa || "",
            source_en: firstMapping.source_en_name || "",
            source_filter: "",
            source_en_id: sourceEnId,
            source_id: "",
            sql_override: "",
          },
          transform_request: {
            id: "",
            strategy: "sql",
            type: "passive",
            subtype: "standard",
            name: "Direct mapping",
            status: "Active",
            transform_config: {},
          },
        };

        await rulesetAPI.create(payload);
      }

      toast({
        title: "Success",
        description: "Mappings saved successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving mappings:", error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save mappings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Review Source Mappings</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Standardized Glossary Meta</TableHead>
                <TableHead>Source Expression</TableHead>
                <TableHead>Source Entity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editedMappings.map((mapping, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {mapping.glossary_meta_name}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={mapping.source_expression}
                      onChange={(e) =>
                        handleMappingChange(index, "source_expression", e.target.value)
                      }
                      placeholder="Enter source expression"
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {mapping.source_en_name}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Mappings
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
