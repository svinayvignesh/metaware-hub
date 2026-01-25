import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { useSearchParams } from "react-router-dom";
import { SubSidebar } from "@/components/layout/SubSidebar";
import { EntityGrid } from "@/components/entity/EntityGrid";
import { DataTable } from "@/components/table/DataTable";
import { useMDConnectionContext } from "@/contexts/MDConnectionContext";
import { queryMDTable } from "@/hooks/useMDConnection";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Database, Loader2, BarChart3, Server, ArrowLeft, Code } from "lucide-react";
import { RuleEditor } from "@/components/rules/RuleEditor";
import { DQDetails } from "@/components/dq/DQDetails";
import { SourceTransformation } from "@/components/transformation/SourceTransformation";
import { API_CONFIG } from "@/config/api";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import { GET_SUBJECTAREAS, GET_ENTITIES, type GetSubjectAreasResponse, type GetEntitiesResponse } from "@/graphql/queries";
import { useLayout } from "@/context/LayoutContext";
import { useToast } from "@/hooks/use-toast";

export default function Staging() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedSubjectAreaId, setSelectedSubjectAreaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const { connection, connect, ready } = useMDConnectionContext();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ columns: string[]; rows: any[] }>({ columns: [], rows: [] });
  const [ruleEditorOpen, setRuleEditorOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [tableNotFound, setTableNotFound] = useState(false);
  const [showDQDetails, setShowDQDetails] = useState(false);
  const [showSourceTransformation, setShowSourceTransformation] = useState(false);
  const [dqExecutionId, setDqExecutionId] = useState<string | null>(null);
  const [loadingDQ, setLoadingDQ] = useState(false);
  const { toast } = useToast();

  const { data: subjectAreasData } = useQuery<GetSubjectAreasResponse>(GET_SUBJECTAREAS);
  const { data: entitiesData } = useQuery<GetEntitiesResponse>(GET_ENTITIES);

  // Layout Controls
  const { sidebarWidth, setHasSubSidebar } = useLayout();
  const selectedSubjectArea = subjectAreasData?.meta_subjectarea.find(sa => sa.id === selectedSubjectAreaId);

  // Register SubSidebar
  useEffect(() => {
    setHasSubSidebar(true);
    return () => setHasSubSidebar(false);
  }, [setHasSubSidebar]);

  // Connect to database on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Handle URL query parameters
  useEffect(() => {
    const entityName = searchParams.get('en');
    const subjectAreaName = searchParams.get('sa');
    const namespaceName = searchParams.get('ns');

    if (entityName && subjectAreaName && namespaceName && entitiesData) {
      // Find the entity that matches all parameters
      const matchingEntity = entitiesData.meta_entity.find(
        entity =>
          entity.subjectarea &&
          entity.subjectarea.namespace &&
          entity.name === entityName &&
          entity.subjectarea.name === subjectAreaName &&
          entity.subjectarea.namespace.name === namespaceName
      );

      if (matchingEntity) {
        setSelectedSubjectAreaId(matchingEntity.sa_id);
        setSelectedEntity(matchingEntity);
      }
    }
  }, [searchParams, entitiesData]);

  useEffect(() => {
    if (ready && connection && selectedEntity) {
      fetchData();
    }
  }, [ready, connection, selectedEntity]);

  // Reset selected entity when subject area changes manually (not from URL params)
  useEffect(() => {
    // Only reset if no URL params are present
    const hasUrlParams = searchParams.get('en') && searchParams.get('sa') && searchParams.get('ns');
    if (!hasUrlParams && selectedSubjectAreaId !== null) {
      setSelectedEntity(null);
    }
  }, [selectedSubjectAreaId, searchParams]);

  const fetchData = async () => {
    if (!connection || !selectedEntity || !selectedEntity.subjectarea || !selectedEntity.subjectarea.namespace) return;

    setLoading(true);
    setTableNotFound(false);
    try {
      const namespace = selectedEntity.subjectarea?.namespace?.name;
      const subjectarea = selectedEntity.subjectarea?.name;
      const entityName = selectedEntity.name;

      const result = await queryMDTable(connection, namespace, subjectarea, entityName);

      // Add unique IDs to rows if they don't have them
      const rowsWithIds = result.rows.map((row, index) => ({
        ...row,
        id: row.id || `row_${index}`
      }));

      setData({ ...result, rows: rowsWithIds });
    } catch (error) {
      console.error("Error fetching entity data:", error);

      // Check if the error is due to table not existing
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Table with name') && errorMessage.includes('does not exist')) {
        setTableNotFound(true);
      }

      setData({ columns: [], rows: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleColumnClick = (columnKey: string) => {
    setSelectedColumn(columnKey);
    setRuleEditorOpen(true);
  };

  const handleDQDetailsClick = async () => {
    if (!selectedEntity || !entityContext) return;

    setLoadingDQ(true);
    try {
      const payload = {
        entity_core: {
          ns: entityContext.ns,
          sa: entityContext.sa,
          en: entityContext.en,
          ns_type: "staging",
          ns_id: entityContext.ns_id,
          sa_id: entityContext.sa_id,
          en_id: entityContext.en_id,
        },
        snapshot_ref: {},
      };

      console.log("🚀 Executing DQ Validation with payload:", payload);

      const response = await fetch(`${API_CONFIG.REST_ENDPOINT}/mwn/execute_dq_validation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ DQ validation API error:", errorText);
        throw new Error(`DQ validation failed with status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ DQ Validation Result:", result);

      // Extract execution ID from response - check multiple locations
      let executionId = result.execution_id || result.executionId || result.id || result.exec_id;

      // If not found at top level, check inside return_data
      if (!executionId && result.return_data) {
        executionId = result.return_data.execution_id || result.return_data.executionId || result.return_data.id || result.return_data.exec_id;
      }

      console.log("🔍 Extracted executionId:", executionId);

      if (!executionId) {
        console.error("❌ No execution ID found in response:", result);
        toast({
          title: "Error",
          description: "No execution ID returned from DQ validation. Check console for details.",
          variant: "destructive",
        });
        throw new Error("No execution ID returned from DQ validation");
      }

      setDqExecutionId(executionId);
      setShowDQDetails(true);

      toast({
        title: "Success",
        description: "DQ validation executed successfully",
      });
    } catch (error) {
      console.error("❌ Error executing DQ validation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to execute DQ validation",
        variant: "destructive",
      });
    } finally {
      setLoadingDQ(false);
    }
  };

  const columns = data.columns.map((col) => ({
    key: col,
    title: col,
    type: "text" as const,
    onHeaderClick: handleColumnClick,
  }));

  const entityContext = selectedEntity && selectedEntity.subjectarea && selectedEntity.subjectarea.namespace ? {
    ns: selectedEntity.subjectarea?.namespace?.name || '',
    sa: selectedEntity.subjectarea?.name || '',
    en: selectedEntity.name,
    ns_id: selectedEntity.subjectarea?.namespace?.id || '',
    sa_id: selectedEntity.subjectarea?.id || '',
    en_id: selectedEntity.id,
  } : null;

  return (
    <div
      className="flex h-[calc(100vh-3.5rem)] fixed right-0 top-14 transition-[left] duration-300 ease-in-out"
      style={{ left: sidebarWidth }}
    >
      <SubSidebar
        namespaceType="staging"
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
                          <Server className="w-6 h-6 text-primary-foreground" />
                        </div>
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight">Staging Management</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">Manage staging models and data processing workflows</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 flex items-center justify-center gap-3">
              <div className="relative w-full max-w-2xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search entities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSubjectAreaId(null);
                }}
                title="Reset search and filters"
                className="rounded-xl flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="px-4 mt-4">
              <EntityGrid
                subjectAreaId={selectedSubjectAreaId || undefined}
                namespaceType="staging"
                searchQuery={searchQuery}
                onEntityClick={setSelectedEntity}
              />
            </div>
          </div>
        ) : !ready ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Connecting to database...</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading data...</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
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
                        {(showDQDetails || showSourceTransformation) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowDQDetails(false);
                              setShowSourceTransformation(false);
                            }}
                            className="h-auto p-0 text-muted-foreground hover:text-foreground"
                          >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Table
                          </Button>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                      <h1 className="text-xl font-bold tracking-tight">{selectedEntity.name}</h1>
                    </div>
                  </div>

                  {/* Right Side - Action Buttons or Active View Title */}
                  <div>
                    {showDQDetails ? (
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">DQ Details</h2>
                      </div>
                    ) : showSourceTransformation ? (
                      <div className="flex items-center gap-2">
                        <Code className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Source Transformation</h2>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleDQDetailsClick}
                          disabled={loadingDQ}
                          className="rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg shadow-primary/20"
                        >
                          {loadingDQ ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <BarChart3 className="mr-2 h-4 w-4" />
                              DQ Details
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setShowSourceTransformation(true)}
                          variant="outline"
                          className="rounded-xl"
                        >
                          <Code className="mr-2 h-4 w-4" />
                          Source Transformation
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 pt-3 overflow-y-auto min-h-0">
              {showDQDetails && dqExecutionId && entityContext ? (
                <DQDetails
                  executionId={dqExecutionId}
                  entityContext={entityContext}
                  onBack={() => setShowDQDetails(false)}
                />
              ) : showSourceTransformation && entityContext ? (
                <SourceTransformation
                  entityContext={entityContext}
                  onBack={() => setShowSourceTransformation(false)}
                />
              ) : data.rows.length === 0 ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="text-center space-y-3 max-w-md">
                    <Database className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <div className="space-y-2">
                      <p className="font-medium text-foreground">
                        {tableNotFound ? 'No Data Loaded' : 'No Data Found'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tableNotFound
                          ? 'This entity exists but has no data loaded yet. Make sure to check "Load Data" when uploading the meta file to load data into the staging table.'
                          : 'No data is available for this entity.'}
                      </p>
                    </div>
                    {!tableNotFound && (
                      <Button variant="outline" size="sm" onClick={fetchData} className="rounded-xl">
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 relative bottom-[15px]">
                  <DataTable columns={columns} data={data.rows} onRefresh={fetchData} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {entityContext && (
        <RuleEditor
          open={ruleEditorOpen}
          onClose={() => setRuleEditorOpen(false)}
          columnName={selectedColumn}
          entityContext={entityContext}
        />
      )}
    </div>
  );
}