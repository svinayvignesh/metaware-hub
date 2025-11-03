import { useState, useEffect } from "react";
import { useLazyQuery, useQuery } from "@apollo/client";
import { SubSidebar } from "@/components/layout/SubSidebar";
import { EntityGrid } from "@/components/entity/EntityGrid";
import { DataTable } from "@/components/table/DataTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, X, Database, Loader2, Upload, Sparkles } from "lucide-react";
import { GET_META_FOR_ENTITY, type MetaField } from "@/graphql/queries/meta";
import { GET_RULESETS_BY_ENTITY, type RulesetWithSource } from "@/graphql/queries/ruleset";
import { GET_SUBJECTAREAS, type GetSubjectAreasResponse } from "@/graphql/queries";
import { SourceAssociationSelect } from "@/components/glossary/SourceAssociationSelect";
import { MappingTable } from "@/components/glossary/MappingTable";
import { RelationshipGraph } from "@/components/glossary/RelationshipGraph";
import { ImportConfigModal } from "@/components/glossary/ImportConfigModal";
import { GenerateBlueprintModal } from "@/components/glossary/GenerateBlueprintModal";
import { StandardizedMetaEditor } from "@/components/glossary/StandardizedMetaEditor";
import { MappingEditorModal } from "@/components/glossary/MappingEditorModal";
import { type Entity } from "@/graphql/queries/entity";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { rulesetAPI } from "@/services/api";

export default function Glossary() {
  const [selectedSubjectAreaId, setSelectedSubjectAreaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [metaFields, setMetaFields] = useState<MetaField[]>([]);
  const [sourceEntity, setSourceEntity] = useState<Entity | null>(null);
  const [activeTab, setActiveTab] = useState("meta");
  const [existingRuleset, setExistingRuleset] = useState<RulesetWithSource | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [blueprintModalOpen, setBlueprintModalOpen] = useState(false);
  const [standardizedMeta, setStandardizedMeta] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [draftMetaFields, setDraftMetaFields] = useState<any[]>([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const { toast } = useToast();
  
  const { data: subjectAreasData } = useQuery<GetSubjectAreasResponse>(GET_SUBJECTAREAS);
  const selectedSubjectArea = subjectAreasData?.meta_subjectarea.find(sa => sa.id === selectedSubjectAreaId);

  const [fetchMeta, { loading: metaLoading }] = useLazyQuery(GET_META_FOR_ENTITY, {
    onCompleted: (data) => {
      if (data?.meta_meta) {
        setMetaFields(data.meta_meta);
      }
    },
    onError: (error) => {
      console.error("Error fetching meta:", error);
    },
  });

  const [fetchRulesets] = useLazyQuery(GET_RULESETS_BY_ENTITY, {
    onCompleted: (data) => {
      if (data.meta_ruleset && data.meta_ruleset.length > 0) {
        const matchingRuleset = data.meta_ruleset.find(
          (rs: RulesetWithSource) =>
            rs.source?.source_en_id === sourceEntity?.id
        );
        setExistingRuleset(matchingRuleset || null);
      } else {
        setExistingRuleset(null);
      }
    },
    onError: (error) => {
      console.error("Error fetching rulesets:", error);
      setExistingRuleset(null);
    },
  });

  // Reset selected entity when subject area changes
  useEffect(() => {
    setSelectedEntity(null);
    setSourceEntity(null);
    setExistingRuleset(null);
  }, [selectedSubjectAreaId]);

  // Fetch meta when entity is selected
  useEffect(() => {
    if (selectedEntity) {
      fetchMeta({ variables: { enid: selectedEntity.id } });
      setSourceEntity(null);
      setExistingRuleset(null);
    }
  }, [selectedEntity, fetchMeta]);

  // Fetch existing rulesets when source entity is selected
  useEffect(() => {
    if (selectedEntity && sourceEntity) {
      fetchRulesets({
        variables: {
          targetEnId: selectedEntity.id,
          type: "glossary_association",
        },
      });
    } else {
      setExistingRuleset(null);
    }
  }, [selectedEntity, sourceEntity, fetchRulesets]);

  const columns = metaFields.map((meta) => ({
    key: meta.alias,
    title: meta.name,
    type: meta.type as any,
  }));

  const handleBlueprintGenerated = (generatedMeta: any[], generatedMappings: any[]) => {
    setStandardizedMeta(generatedMeta);
    setMappings(generatedMappings);
    setDraftMetaFields(generatedMeta);
    setActiveTab("meta");
  };

  const handleSaveDraftMeta = async () => {
    if (!selectedEntity || draftMetaFields.length === 0) return;

    setIsSavingDraft(true);
    try {
      const { entityAPI } = await import("@/services/api");

      const entityRequest = {
        ns: selectedEntity.subjectarea?.namespace?.name || "",
        sa: selectedEntity.subjectarea?.name || "",
        en: selectedEntity.name,
        ns_type: "glossary",
        ns_id: selectedEntity.subjectarea?.namespace?.id || "",
        sa_id: selectedEntity.sa_id,
        en_id: selectedEntity.id,
      };

      const metaRequests = draftMetaFields.map((item: any) => ({
        name: item.name || "",
        alias: item.alias || "",
        description: item.description || "",
        type: item.type || "text",
        nullable: item.nullable !== undefined ? item.nullable : true,
        unique: item.unique !== undefined ? item.unique : false,
        primary: item.primary !== undefined ? item.primary : false,
        autoincrement: item.autoincrement !== undefined ? item.autoincrement : false,
        default_value: item.default_value || null,
        reference: item.reference || null,
        meta_status: "active",
      }));

      const response = await entityAPI.createWithMeta(entityRequest, metaRequests) as { meta?: any[] };
      const savedMeta = response.meta || [];

      // Enrich mappings with glossary_meta_id from saved meta
      const enrichedMappings = mappings.map(mapping => {
        const matchingMeta = savedMeta.find((meta: any) => meta.name === mapping.glossary_meta_name);
        return {
          ...mapping,
          glossary_meta_id: matchingMeta?.id || "",
        };
      });

      // Group mappings by source entity
      const mappingsBySource = enrichedMappings.reduce<Record<string, any[]>>((acc, mapping) => {
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
            ns: selectedEntity.subjectarea?.namespace?.name || "",
            sa: selectedEntity.subjectarea?.name || "",
            en: selectedEntity.name,
            ns_type: "glossary",
            ns_id: selectedEntity.subjectarea?.namespace?.id || "",
            sa_id: selectedEntity.sa_id,
            en_id: selectedEntity.id,
          },
          ruleset_request: {
            name: `${selectedEntity.subjectarea?.namespace?.name}_${selectedEntity.subjectarea?.name}_${selectedEntity.name}_to_${firstMapping.source_ns}_${firstMapping.source_sa}_${firstMapping.source_en_name}_ruleset`,
            description: `${selectedEntity.subjectarea?.namespace?.name}_${selectedEntity.subjectarea?.name}_${selectedEntity.name}_to_${firstMapping.source_ns}_${firstMapping.source_sa}_${firstMapping.source_en_name}_ruleset`,
            type: "glossary_association",
            rule_requests: sourceMappings.map((mapping) => ({
              meta: mapping.glossary_meta_name,
              rule_expression: mapping.source_expression,
              name: `${mapping.glossary_meta_name}_rule`,
              description: `${mapping.glossary_meta_name}_rule`,
              language: "sql",
              rule_status: "active",
              subtype: ".",
              type: "glossary",
            })),
          },
          source_request: {
            type: "DIRECT",
            source_ns: firstMapping.source_ns || "",
            source_sa: firstMapping.source_sa || "",
            source_en: firstMapping.source_en_name || "",
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
        description: "Metadata and mappings saved successfully",
      });

      // Clear draft state
      setDraftMetaFields([]);
      setStandardizedMeta([]);
      setMappings([]);
      
      // Refetch meta to show the newly created meta
      if (selectedEntity) {
        fetchMeta({ variables: { enid: selectedEntity.id } });
      }

      // Switch to Source Associations tab
      setActiveTab("associations");
    } catch (error) {
      console.error("Error saving draft meta:", error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save metadata",
        variant: "destructive",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const draftMetaColumns = draftMetaFields.length > 0 ? [
    { key: 'name', title: 'Name', type: 'text' as const },
    { key: 'alias', title: 'Alias', type: 'text' as const },
    { key: 'type', title: 'Type', type: 'text' as const },
    { key: 'description', title: 'Description', type: 'text' as const },
    { key: 'nullable', title: 'Nullable', type: 'checkbox' as const },
    { key: 'unique', title: 'Unique', type: 'checkbox' as const },
    { key: 'primary', title: 'Primary', type: 'checkbox' as const },
  ] : [];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] fixed left-64 right-0 top-14">
      <SubSidebar
        namespaceType="glossary"
        onSubjectAreaSelect={setSelectedSubjectAreaId}
        selectedSubjectAreaId={selectedSubjectAreaId || undefined}
      />
      
      <div className="flex-1 overflow-hidden">
        {!selectedEntity ? (
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <button 
                      onClick={() => {
                        setSelectedEntity(null);
                        setSelectedSubjectAreaId(null);
                        setSearchQuery("");
                      }}
                      className="hover:text-foreground transition-colors"
                    >
                      Business Glossary
                    </button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {selectedSubjectArea && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{selectedSubjectArea.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Business Glossary</h1>
              <p className="text-muted-foreground">
                Manage business terms and definitions
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search entities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setImportModalOpen(true)}
                title="Import configuration"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSubjectAreaId(null);
                }}
                title="Reset search and filters"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ImportConfigModal
              open={importModalOpen}
              onOpenChange={setImportModalOpen}
              onSuccess={() => {
                // Optionally refresh data after import
              }}
            />

            <EntityGrid
              subjectAreaId={selectedSubjectAreaId || undefined}
              namespaceType="glossary"
              searchQuery={searchQuery}
              onEntityClick={setSelectedEntity}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col p-6">
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <button 
                      onClick={() => {
                        setSelectedEntity(null);
                        setSelectedSubjectAreaId(null);
                      }} 
                      className="hover:text-foreground transition-colors"
                    >
                      {selectedEntity.subjectarea?.namespace?.name || 'Unknown'}
                    </button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <button 
                      onClick={() => {
                        setSelectedSubjectAreaId(selectedEntity.sa_id);
                        setSelectedEntity(null);
                      }} 
                      className="hover:text-foreground transition-colors"
                    >
                      {selectedEntity.subjectarea.name}
                    </button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{selectedEntity.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="mb-4 flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEntity(null)}
              >
                ← Back to list
              </Button>
              <div className="flex-1">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  {selectedEntity.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedEntity.subjectarea?.namespace?.name || 'Unknown'} / {selectedEntity.subjectarea?.name || 'Unknown'}
                </p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList>
                <TabsTrigger value="meta">Meta</TabsTrigger>
                <TabsTrigger value="associations">Source Associations</TabsTrigger>
                <TabsTrigger value="relationships">Glossary Relationship</TabsTrigger>
              </TabsList>

              <TabsContent value="meta" className="flex-1 overflow-hidden mt-4 flex flex-col">
                {metaLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : draftMetaFields.length > 0 ? (
                  <div className="flex flex-col h-full gap-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Review and edit the generated metadata below. Click Save to persist changes.
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDraftMetaFields([]);
                            setStandardizedMeta([]);
                            setMappings([]);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveDraftMeta}
                          disabled={isSavingDraft}
                        >
                          {isSavingDraft && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Save Meta
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 border rounded-lg overflow-hidden">
                      <DataTable
                        data={[]}
                        externalEditedData={draftMetaFields.map(field => ({
                          ...field,
                          id: field.id || `draft_${field.name}`,
                          _status: 'draft' as const,
                        }))}
                        onEditedDataChange={(data) => {
                          setDraftMetaFields(data.map(({ _status, ...rest }) => rest));
                        }}
                        columns={draftMetaColumns}
                        onAdd={() => {
                          const newField = {
                            id: `new_${Date.now()}`,
                            name: '',
                            alias: '',
                            type: 'text',
                            description: '',
                            nullable: true,
                            unique: false,
                            primary: false,
                          };
                          setDraftMetaFields([...draftMetaFields, newField]);
                        }}
                      />
                    </div>
                  </div>
                ) : metaFields.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-4">
                      <Database className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No metadata found</p>
                      <Button
                        onClick={() => setBlueprintModalOpen(true)}
                        className="mt-4"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Standardized Blueprint
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden h-full">
                    <div className="overflow-auto h-full">
                      <table className="w-full">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left p-4 font-medium">Name</th>
                            <th className="text-left p-4 font-medium">Alias</th>
                            <th className="text-left p-4 font-medium">Type</th>
                            <th className="text-left p-4 font-medium">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metaFields.map((field) => (
                            <tr key={field.id} className="border-t hover:bg-muted/30">
                              <td className="p-4">{field.name}</td>
                              <td className="p-4 font-mono text-sm">{field.alias}</td>
                              <td className="p-4">{field.type}</td>
                              <td className="p-4 text-muted-foreground">
                                {field.description || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="associations" className="flex-1 overflow-auto mt-4">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Association</label>
                    <SourceAssociationSelect
                      glossaryEntity={selectedEntity}
                      value={sourceEntity?.id}
                      onSelect={setSourceEntity}
                    />
                  </div>

                  {sourceEntity && (
                    <MappingTable
                      glossaryEntity={selectedEntity}
                      sourceEntity={sourceEntity}
                      existingRuleset={existingRuleset || undefined}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="relationships" className="flex-1 overflow-hidden mt-4">
                <RelationshipGraph
                  entityId={selectedEntity.id}
                  entityName={selectedEntity.name}
                />
              </TabsContent>
            </Tabs>

            <GenerateBlueprintModal
              open={blueprintModalOpen}
              onOpenChange={setBlueprintModalOpen}
              namespaceId={selectedEntity.subjectarea?.namespace?.id || ""}
              glossaryEntity={selectedEntity}
              onSuccess={handleBlueprintGenerated}
            />
          </div>
        )}
      </div>
    </div>
  );
}