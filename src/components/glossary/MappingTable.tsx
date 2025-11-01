import { useState, useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { Trash2, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { GET_META_FOR_ENTITY, type MetaField } from "@/graphql/queries/meta";
import { type Entity } from "@/graphql/queries/entity";
import { type RulesetWithSource } from "@/graphql/queries/ruleset";
import { AddGlossaryMetaModal } from "./AddGlossaryMetaModal";
import { API_CONFIG } from "@/config/api";

interface MappingRow {
  id: string;
  glossaryMeta: MetaField;
  sourceMetaAlias?: string;
}

interface MappingTableProps {
  glossaryEntity: Entity;
  sourceEntity: Entity;
  existingRuleset?: RulesetWithSource;
}

export function MappingTable({ glossaryEntity, sourceEntity, existingRuleset }: MappingTableProps) {
  const { toast } = useToast();
  const [mappingRows, setMappingRows] = useState<MappingRow[]>([]);
  const [sourceMetaFields, setSourceMetaFields] = useState<MetaField[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fetchSourceMeta, { loading: sourceMetaLoading }] = useLazyQuery(
    GET_META_FOR_ENTITY,
    {
      onCompleted: (data) => {
        if (data?.meta_meta) {
          setSourceMetaFields(data.meta_meta);
        }
      },
      onError: (error) => {
        console.error("Error fetching source meta:", error);
        toast({
          title: "Error",
          description: "Failed to fetch source metadata fields",
          variant: "destructive",
        });
      },
    }
  );

  useEffect(() => {
    if (sourceEntity) {
      fetchSourceMeta({ variables: { enid: sourceEntity.id } });
    }
  }, [sourceEntity, fetchSourceMeta]);

  // Load existing ruleset mappings when existingRuleset changes
  useEffect(() => {
    if (existingRuleset && existingRuleset.rules) {
      const existingRows: MappingRow[] = existingRuleset.rules.map((rule) => ({
        id: rule.id || crypto.randomUUID(),
        glossaryMeta: {
          id: rule.meta_id || "",
          name: rule.meta?.name || rule.name,
          alias: rule.meta?.name || rule.alias || "",
          type: "string",
          is_primary_grain: false,
          is_secondary_grain: false,
          is_tertiary_grain: false,
          nullable: true,
        } as MetaField,
        sourceMetaAlias: rule.rule_expression,
      }));
      setMappingRows(existingRows);
    } else {
      setMappingRows([]);
    }
  }, [existingRuleset, sourceEntity]);

  const handleAddGlossaryMetas = (selectedMetas: MetaField[], removedIds: string[]) => {
    // Remove rows for unchecked items
    setMappingRows((prev) => {
      const filtered = prev.filter((row) => !removedIds.includes(row.glossaryMeta.id));
      
      // Add new rows for newly selected items
      const newRows: MappingRow[] = selectedMetas.map((meta) => ({
        id: crypto.randomUUID(),
        glossaryMeta: meta,
      }));
      
      return [...filtered, ...newRows];
    });
  };

  const handleRemoveRow = (rowId: string) => {
    setMappingRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleSourceMetaChange = (rowId: string, sourceMetaAlias: string) => {
    setMappingRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, sourceMetaAlias } : row
      )
    );
  };

  const handleSave = async () => {
    // Validate that all rows have source mappings
    const incomplete = mappingRows.filter((row) => !row.sourceMetaAlias);
    if (incomplete.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please map all glossary meta fields to source columns",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const ruleRequests = mappingRows.map((row) => ({
        meta: row.glossaryMeta.alias,
        rule_expression: row.sourceMetaAlias,
        name: `${row.glossaryMeta.alias}_rule`,
        description: `${row.glossaryMeta.alias}_rule`,
        language: "sql",
        rule_status: "active",
        subtype: ".",
        type: "glossary",
      }));

      const payload = {
        entity_core: {
          ns: glossaryEntity.subjectarea.namespace.name,
          sa: glossaryEntity.subjectarea.name,
          en: glossaryEntity.name,
        },
        ruleset_request: {
          name: `${glossaryEntity.subjectarea.namespace.name}_${glossaryEntity.subjectarea.name}_${glossaryEntity.name}_to_staging_${sourceEntity.subjectarea.name}_${sourceEntity.name}_ruleset`,
          description: `${glossaryEntity.subjectarea.namespace.name}_${glossaryEntity.subjectarea.name}_${glossaryEntity.name}_to_staging_${sourceEntity.subjectarea.name}_${sourceEntity.name}_ruleset`,
          type: "glossary_association",
          rule_requests: ruleRequests,
        },
        source_request: {
          type: "DIRECT",
          source_ns: sourceEntity.subjectarea.namespace.name,
          source_sa: sourceEntity.subjectarea.name,
          source_en: sourceEntity.name,
        },
      };

      const response = await fetch(
        `${API_CONFIG.REST_ENDPOINT}/mwn/create_ruleset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create rulesets: ${response.status}`);
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: "Mapping saved successfully",
      });

      console.log("Ruleset created:", result);
    } catch (error) {
      console.error("Error saving mapping:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save mapping",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const alreadySelectedIds = new Set(mappingRows.map((row) => row.glossaryMeta.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Field Mapping</h3>
        <div className="flex gap-2">
          <Button onClick={() => setIsModalOpen(true)} variant="outline">
            Add Glossary Meta
          </Button>
          <Button
            onClick={handleSave}
            disabled={mappingRows.length === 0 || saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Mapping"
            )}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium w-[45%]">
                Glossary Standardized Meta
              </th>
              <th className="text-left p-4 font-medium w-[45%]">
                Source Expression
              </th>
              <th className="text-left p-4 font-medium w-[10%]"></th>
            </tr>
          </thead>
          <tbody>
            {mappingRows.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-muted-foreground">
                  No mappings added. Click "Add Glossary Meta" to get started.
                </td>
              </tr>
            ) : (
              mappingRows.map((row) => (
                <tr key={row.id} className="border-t hover:bg-muted/30">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{row.glossaryMeta.name}</span>
                      <Badge variant="secondary">{row.glossaryMeta.type}</Badge>
                    </div>
                  </td>
                  <td className="p-4">
                    {sourceMetaLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={row.sourceMetaAlias || ""}
                          onChange={(e) =>
                            handleSourceMetaChange(row.id, e.target.value)
                          }
                          placeholder="Type expression or select"
                          className="flex-1"
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-2" align="end">
                            <div className="space-y-1">
                              {sourceMetaFields.map((meta) => (
                                <Button
                                  key={meta.id}
                                  variant="ghost"
                                  className="w-full justify-start"
                                  onClick={() => {
                                    handleSourceMetaChange(row.id, meta.alias);
                                  }}
                                >
                                  {meta.alias}
                                </Button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRow(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddGlossaryMetaModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        entityId={glossaryEntity.id}
        onSave={handleAddGlossaryMetas}
        alreadySelectedIds={alreadySelectedIds}
      />
    </div>
  );
}
