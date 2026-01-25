import { useState, useEffect, useRef } from "react";
import { useLazyQuery, useQuery } from "@apollo/client";
import { SubSidebar } from "@/components/layout/SubSidebar";
import { EntityGrid } from "@/components/entity/EntityGrid";
import { DataTable } from "@/components/table/DataTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, X, Database, Loader2, Upload, Sparkles, Wand2, GitGraph, ArrowLeft, BookOpen } from "lucide-react";
import { GET_META_FOR_ENTITY, type MetaField } from "@/graphql/queries/meta";
import { GET_RULESETS_BY_ENTITY, type RulesetWithSource } from "@/graphql/queries/ruleset";
import { GET_SUBJECTAREAS, type GetSubjectAreasResponse } from "@/graphql/queries";
import { SourceAssociationSelect } from "@/components/glossary/SourceAssociationSelect";
import { RelationshipGraph } from "@/components/glossary/RelationshipGraph";
import { MappingTable } from "@/components/glossary/MappingTable";
import { ImportConfigModal } from "@/components/glossary/ImportConfigModal";
import { GenerateBlueprintModal } from "@/components/glossary/GenerateBlueprintModal";
import { CustomBlueprintModal } from "@/components/glossary/CustomBlueprintModal";
import { StandardizedMetaEditor } from "@/components/glossary/StandardizedMetaEditor";
import { MappingEditorModal } from "@/components/glossary/MappingEditorModal";
import { EntityERDGraph } from "@/components/glossary/EntityERDGraph";
import { type Entity } from "@/graphql/queries/entity";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { rulesetAPI, metaAPI } from "@/services/api";
import { GlossaryAssociations } from "@/components/glossary/GlossaryAssociations";
import { useLayout } from "@/context/LayoutContext";

export default function Glossary() {
  const navigate = useNavigate();
  const [selectedSubjectAreaId, setSelectedSubjectAreaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [metaFields, setMetaFields] = useState<MetaField[]>([]);
  const [sourceEntity, setSourceEntity] = useState<Entity | null>(null);
  const [activeTab, setActiveTab] = useState("meta");
  const [existingRuleset, setExistingRuleset] = useState<RulesetWithSource | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [blueprintModalOpen, setBlueprintModalOpen] = useState(false);
  const [customBlueprintModalOpen, setCustomBlueprintModalOpen] = useState(false);
  const [standardizedMeta, setStandardizedMeta] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [draftMetaFields, setDraftMetaFields] = useState<any[]>([]);
  const [originalDraftMetaFields, setOriginalDraftMetaFields] = useState<any[]>([]);
  const [editModeSnapshot, setEditModeSnapshot] = useState<any[]>([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Graph States
  // Graph States
  const [showDiagram, setShowDiagram] = useState(false); // ERD Graph
  const [showGlossaryGraph, setShowGlossaryGraph] = useState(false); // Glossary Model Graph

  const { toast } = useToast();

  // Layout Controls
  const {
    sidebarWidth,
    isSidebarCollapsed,
    setSidebarCollapsed,
    isSubSidebarCollapsed,
    setSubSidebarCollapsed,
    setHasSubSidebar
  } = useLayout();

  // Register SubSidebar
  useEffect(() => {
    setHasSubSidebar(true);
    return () => setHasSubSidebar(false);
  }, [setHasSubSidebar]);

  // Ref to track if we're in "Graph Mode" and what the previous state was
  const wasGraphOpenRef = useRef(false);
  const prevSidebarStateRef = useRef({ main: false, sub: false });

  const isAnyGraphOpen = showDiagram || showGlossaryGraph;

  // Auto-collapse logic
  useEffect(() => {
    if (isAnyGraphOpen && !wasGraphOpenRef.current) {
      // Transitioning TO Graph Mode
      // Save current state BEFORE collapsing
      prevSidebarStateRef.current = {
        main: isSidebarCollapsed,
        sub: isSubSidebarCollapsed
      };
      wasGraphOpenRef.current = true;

      // Force collapse
      setSidebarCollapsed(true);
      setSubSidebarCollapsed(true);
    } else if (!isAnyGraphOpen && wasGraphOpenRef.current) {
      // Transitioning FROM Graph Mode
      // Restore previous state
      setSidebarCollapsed(prevSidebarStateRef.current.main);
      setSubSidebarCollapsed(prevSidebarStateRef.current.sub);

      wasGraphOpenRef.current = false;
    }
  }, [isAnyGraphOpen, isSidebarCollapsed, isSubSidebarCollapsed, setSidebarCollapsed, setSubSidebarCollapsed]);

  // Reset graphs when going back to list
  useEffect(() => {
    if (!selectedEntity) {
      setShowDiagram(false);
      setShowGlossaryGraph(false);
    }
  }, [selectedEntity]);

  const { data: subjectAreasData } = useQuery<GetSubjectAreasResponse>(GET_SUBJECTAREAS);
  const selectedSubjectArea = subjectAreasData?.meta_subjectarea.find(sa => sa.id === selectedSubjectAreaId);

  const [fetchMeta, { loading: metaLoading, data: metaData, error: metaError }] = useLazyQuery(GET_META_FOR_ENTITY);

  const [fetchRulesets, { data: rulesetsData, error: rulesetsError }] = useLazyQuery(GET_RULESETS_BY_ENTITY);

  // Handle meta data updates
  useEffect(() => {
    if (metaData?.meta_meta) {
      setMetaFields(metaData.meta_meta);
    }
  }, [metaData]);

  // Handle meta errors
  useEffect(() => {
    if (metaError) {
      console.error("Error fetching meta:", metaError);
    }
  }, [metaError]);

  // Handle rulesets data updates
  useEffect(() => {
    if (rulesetsData?.meta_ruleset && rulesetsData.meta_ruleset.length > 0) {
      const matchingRuleset = rulesetsData.meta_ruleset.find(
        (rs: RulesetWithSource) =>
          rs.source?.source_en_id === sourceEntity?.id
      );
      setExistingRuleset(matchingRuleset || null);
    } else if (rulesetsData) {
      setExistingRuleset(null);
    }
  }, [rulesetsData, sourceEntity?.id]);

  // Handle rulesets errors
  useEffect(() => {
    if (rulesetsError) {
      console.error("Error fetching rulesets:", rulesetsError);
      setExistingRuleset(null);
    }
  }, [rulesetsError]);

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

  const metaTableColumns = [
    { key: 'name', title: 'Name', type: 'text' as const },
    { key: 'alias', title: 'Alias', type: 'text' as const },
    { key: 'type', title: 'Type', type: 'text' as const },
    { key: 'description', title: 'Description', type: 'text' as const },
    { key: 'nullable', title: 'Nullable', type: 'checkbox' as const },
    { key: 'is_primary_grain', title: 'Primary Grain', type: 'checkbox' as const },
    { key: 'is_secondary_grain', title: 'Secondary Grain', type: 'checkbox' as const },
    { key: 'is_tertiary_grain', title: 'Tertiary Grain', type: 'checkbox' as const },
    { key: 'order', title: 'Order', type: 'number' as const },
  ];

  const handleBlueprintGenerated = (generatedMeta: any[], generatedMappings: any[]) => {
    setStandardizedMeta(generatedMeta);
    setMappings(generatedMappings);
    setDraftMetaFields(generatedMeta);
    setOriginalDraftMetaFields(generatedMeta);
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
        name: selectedEntity.name,
        type: "glossary",
        ns_type: "glossary",
        ns_id: selectedEntity.subjectarea?.namespace?.id || "",
        sa_id: selectedEntity.sa_id,
        en_id: selectedEntity.id,
      };

      const metaRequests = draftMetaFields.map((item: any, index: number) => ({
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
        order: index,
        ns: selectedEntity.subjectarea?.namespace?.name || "",
        sa: selectedEntity.subjectarea?.name || "",
        en: selectedEntity.name,
      }));

      const response = await entityAPI.createWithMeta(entityRequest, metaRequests) as { meta?: any[] };
      const savedMeta = response.meta || [];

      toast({
        title: "Success",
        description: "Metadata saved successfully",
      });

      // Clear draft state
      setDraftMetaFields([]);
      setStandardizedMeta([]);
      setMappings([]);
      setEditModeSnapshot([]);

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

  const handleSaveExistingMeta = async (editedData: any[]) => {
    if (!selectedEntity) return;

    setIsSavingDraft(true);
    try {
      const { entityAPI } = await import("@/services/api");

      const entityRequest = {
        id: selectedEntity.id,
        type: selectedEntity.type,
        subtype: selectedEntity.subtype || "",
        name: selectedEntity.name,
        description: selectedEntity.description || "",
        is_delta: false,
        runtime: "",
        tags: "",
        custom_props: [],
        dependency: "",
        primary_grain: selectedEntity.primary_grain || "",
        secondary_grain: selectedEntity.secondary_grain || "",
        tertiary_grain: selectedEntity.tertiary_grain || "",
        sa_id: selectedEntity.sa_id,
        update_strategy_: "I",
        ns: selectedEntity.subjectarea?.namespace?.name || "",
        sa: selectedEntity.subjectarea?.name || "",
        ns_type: "glossary",
      };

      const metaRequests = editedData.map((meta) => ({
        id: meta.id,
        type: meta.type,
        subtype: meta.subtype || "",
        name: meta.name,
        description: meta.description || "",
        order: meta.order || 0,
        alias: meta.alias || "",
        length: meta.length || null,
        default: meta.default || null,
        nullable: meta.nullable ?? true,
        format: meta.format || null,
        is_primary_grain: meta.is_primary_grain ?? false,
        is_secondary_grain: meta.is_secondary_grain ?? false,
        is_tertiary_grain: meta.is_tertiary_grain ?? false,
        tags: meta.tags || "",
        custom_props: meta.custom_props || [],
        entity_id: selectedEntity.id,
        ns: selectedEntity.subjectarea?.namespace?.name || "",
        sa: selectedEntity.subjectarea?.name || "",
        en: selectedEntity.name,
        entity_core: {
          ns: selectedEntity.subjectarea?.namespace?.name || "",
          sa: selectedEntity.subjectarea?.name || "",
          en: selectedEntity.name,
          ns_type: "glossary",
          ns_id: selectedEntity.subjectarea?.namespace?.id || "",
          sa_id: selectedEntity.sa_id,
          en_id: selectedEntity.id,
        },
      }));

      await entityAPI.createWithMeta(entityRequest, metaRequests);

      toast({
        title: "Success",
        description: "Metadata saved successfully",
      });

      // Refetch meta to show the updated data
      if (selectedEntity) {
        fetchMeta({ variables: { enid: selectedEntity.id } });
      }
    } catch (error) {
      console.error("Error saving meta:", error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save metadata",
        variant: "destructive",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDeleteMeta = async (ids: string[]) => {
    setIsDeleting(true);
    try {
      // Separate draft IDs (new, unsaved) from persisted IDs
      const draftIds = ids.filter(id => id.startsWith('draft_') || id.startsWith('new_'));
      const persistedIds = ids.filter(id => !id.startsWith('draft_') && !id.startsWith('new_'));

      // Delete persisted rows from server
      if (persistedIds.length > 0) {
        await metaAPI.delete(persistedIds);
      }

      // Remove draft rows from local state
      if (draftIds.length > 0) {
        setDraftMetaFields(prev => prev.filter(row => !draftIds.includes(row.id)));
      }

      toast({
        title: "Success",
        description: `${ids.length} meta field(s) deleted successfully`,
      });

      // Always refetch meta to get fresh data from server
      if (selectedEntity) {
        await fetchMeta({ variables: { enid: selectedEntity.id } });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete meta fields: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const draftMetaColumns = draftMetaFields.length > 0 ? [
    { key: 'name', title: 'Name', type: 'text' as const },
    { key: 'alias', title: 'Alias', type: 'text' as const },
    { key: 'type', title: 'Type', type: 'text' as const },
    { key: 'description', title: 'Description', type: 'text' as const },
    { key: 'nullable', title: 'Nullable', type: 'checkbox' as const },
    { key: 'is_primary_grain', title: 'Primary Grain', type: 'checkbox' as const },
    { key: 'is_secondary_grain', title: 'Secondary Grain', type: 'checkbox' as const },
    { key: 'is_tertiary_grain', title: 'Tertiary Grain', type: 'checkbox' as const },
    { key: 'order', title: 'Order', type: 'number' as const },
  ] : [];

  return (
    <div
      className="flex h-[calc(100vh-3.5rem)] fixed right-0 top-14 transition-[left] duration-300 ease-in-out"
      style={{ left: sidebarWidth }}
    >
      <SubSidebar
        namespaceType="glossary"
        onSubjectAreaSelect={setSelectedSubjectAreaId}
        selectedSubjectAreaId={selectedSubjectAreaId || undefined}
      />

      <div className="flex-1 overflow-hidden">
        {!selectedEntity ? (
          <div className="h-full overflow-y-auto">
            {/* Header */}
            <div className="px-4 pb-4 pt-2">
              <div>
                <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-2xl shadow-primary/5 px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                          <BookOpen className="w-6 h-6 text-primary-foreground" />
                        </div>
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight">Business Glossary</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">Manage business terms and definitions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 flex items-center justify-center gap-3">
              <div className="relative w-full max-w-2xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm icon-muted" />
                <Input type="text" placeholder="Search entities..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 rounded-xl" />
              </div>
              <Button variant="outline" size="icon" onClick={() => setImportModalOpen(true)} title="Import configuration" className="rounded-xl flex-shrink-0">
                <Upload className="icon-sm" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => { setSearchQuery(""); setSelectedSubjectAreaId(null); }} title="Reset search and filters" className="rounded-xl flex-shrink-0">
                <X className="icon-sm" />
              </Button>
            </div>

            <ImportConfigModal open={importModalOpen} onOpenChange={setImportModalOpen} onSuccess={() => {
              // Optionally refresh data after import
            }} />

            <div className="px-4 mt-4">
              <EntityGrid subjectAreaId={selectedSubjectAreaId || undefined} namespaceType="glossary" searchQuery={searchQuery} onEntityClick={setSelectedEntity} />
            </div>
          </div>
        ) : (
          <div className="page-container flex flex-col">
            {/* Modern Header */}
            <div className="px-4 pb-4 pt-2">
              <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-2xl shadow-primary/5 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                      <Database className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      {/* Breadcrumb Navigation */}
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => setSelectedEntity(null)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEntity(null);
                            setSelectedSubjectAreaId(null);
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {selectedEntity.subjectarea?.namespace?.name || 'Unknown'}
                        </button>
                        <span className="text-xs text-muted-foreground">•</span>
                        <button
                          onClick={() => {
                            setSelectedSubjectAreaId(selectedEntity.sa_id);
                            setSelectedEntity(null);
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {selectedEntity.subjectarea.name}
                        </button>
                      </div>
                      <h1 className="text-xl font-bold tracking-tight">{selectedEntity.name}</h1>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 flex-1 flex flex-col overflow-hidden">

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-scroll">
                {/* Hide tabs when any graph is open */}
                {!showDiagram && !showGlossaryGraph && (
                  <TabsList className="rounded-xl bg-muted/50">
                    <TabsTrigger value="meta" className="rounded-lg">Meta</TabsTrigger>
                    <TabsTrigger value="associations" className="rounded-lg">Source Associations</TabsTrigger>
                    <TabsTrigger value="glossary_associations" className="rounded-lg">Glossary Associations</TabsTrigger>
                  </TabsList>
                )}

                <TabsContent value="meta" className={`mt-0 flex-1 overflow-hidden flex flex-col ${activeTab !== 'meta' ? 'hidden' : ''}`}>
                  {metaLoading ? (
                    <div className="flex-center h-full">
                      <Loader2 className="icon-xl animate-spin text-muted-foreground" />
                    </div>
                  ) : draftMetaFields.length > 0 ? (
                    <div className="flex-1 overflow-hidden bordered-container">
                      <DataTable
                        data={[]}
                        externalEditedData={draftMetaFields.map(field => ({ ...field, id: field.id || `draft_${field.name}`, _status: 'draft' as const, }))}
                        onEditedDataChange={(data) => { setDraftMetaFields(data.map(({ _status, ...rest }) => rest)); }}
                        onEditModeChange={(isEditing) => {
                          if (isEditing) {
                            // Snapshot current state when entering edit mode
                            setEditModeSnapshot(JSON.parse(JSON.stringify(draftMetaFields)));
                          } else {
                            // Revert to snapshot when exiting edit mode without saving
                            if (editModeSnapshot.length > 0) {
                              setDraftMetaFields(editModeSnapshot);
                              setEditModeSnapshot([]);
                            }
                          }
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
                            is_primary_grain: false,
                            is_secondary_grain: false,
                            is_tertiary_grain: false,
                            order: draftMetaFields.length,
                          };
                          setDraftMetaFields([...draftMetaFields, newField]);
                        }}
                        onSave={handleSaveDraftMeta}
                        onDelete={handleDeleteMeta}
                        isSaving={isSavingDraft}
                        isDeleting={isDeleting}
                      />
                    </div>
                  ) : metaFields.length === 0 ? (
                    <div className="flex-center h-full">
                      <div className="text-center stack-md">
                        <Database className="icon-xl mx-auto icon-muted opacity-50" />
                        <p className="text-muted">No metadata found</p>
                        <div className="flex gap-3 justify-center">
                          <Button
                            onClick={() => setBlueprintModalOpen(true)}
                            className="rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/20"
                          >
                            <Sparkles className="icon-sm mr-2" />
                            Generate Standardized Blueprint
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setCustomBlueprintModalOpen(true)}
                            className="rounded-xl"
                          >
                            <Wand2 className="icon-sm mr-2" />
                            Generate Custom Blueprint
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-hidden">
                      <DataTable
                        data={metaFields.map(field => ({
                          id: field.id,
                          name: field.name,
                          alias: field.alias || '',
                          type: field.type,
                          description: field.description || '',
                          nullable: field.nullable || false,
                          is_primary_grain: field.is_primary_grain || false,
                          is_secondary_grain: field.is_secondary_grain || false,
                          is_tertiary_grain: field.is_tertiary_grain || false,
                          order: field.order || 0,
                        }))}
                        columns={metaTableColumns}
                        onSave={handleSaveExistingMeta}
                        onAdd={() => { setBlueprintModalOpen(true); }} // Open blueprint modal to add more meta 
                        onDelete={handleDeleteMeta}
                        isSaving={isSavingDraft}
                        isDeleting={isDeleting}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="associations" className="mt-0 flex-1 overflow-auto">
                  <div className="stack-lg card-padding h-full min-h-0 flex flex-col">
                    {showDiagram ? (
                      <div className="h-full flex flex-col">
                        <div className="flex-1 border rounded-lg overflow-hidden relative min-h-0">
                          <EntityERDGraph entityId={selectedEntity.id} entityName={selectedEntity.name} onClose={() => setShowDiagram(false)} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-none space-y-4">
                          <div className="flex items-end gap-4">
                            <div className="flex-1">
                              <SourceAssociationSelect glossaryEntity={selectedEntity} value={sourceEntity?.id} onSelect={setSourceEntity} />
                            </div>
                            <div>
                              <Button
                                onClick={() => setShowDiagram(true)}
                                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg border-0 transition-all duration-300"
                              >
                                <GitGraph className="w-4 h-4 mr-2" />
                                View Relationship Diagram
                              </Button>
                            </div>
                          </div>
                        </div>

                        {!sourceEntity && (
                          <div className="flex-center py-12 border-2 border-dashed border-border rounded-2xl bg-muted/20">
                            <div className="text-center space-y-2">
                              <p className="text-muted-foreground text-sm">No source entity selected</p>
                              <p className="text-xs text-muted-foreground">Select a source entity above to view and manage field mappings</p>
                            </div>
                          </div>
                        )}

                        {sourceEntity && (<MappingTable glossaryEntity={selectedEntity} sourceEntity={sourceEntity} existingRuleset={existingRuleset || undefined} />)}
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="glossary_associations" className="mt-0 flex-1 overflow-hidden">
                  <GlossaryAssociations
                    glossaryEntity={selectedEntity}
                    metaFields={metaFields}
                    showGraph={showGlossaryGraph}
                    onShowGraphChange={setShowGlossaryGraph}
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

              <CustomBlueprintModal
                open={customBlueprintModalOpen}
                onOpenChange={setCustomBlueprintModalOpen}
                glossaryEntity={selectedEntity}
                onSuccess={handleBlueprintGenerated}
              />
            </div>
          </div>
        )}
      </div>
    </div >
  );
}