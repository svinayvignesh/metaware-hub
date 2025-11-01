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
import { Search, X, Database, Loader2 } from "lucide-react";
import { RuleEditor } from "@/components/rules/RuleEditor";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { GET_SUBJECTAREAS, GET_ENTITIES, type GetSubjectAreasResponse, type GetEntitiesResponse } from "@/graphql/queries";

export default function Staging() {
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
  
  const { data: subjectAreasData } = useQuery<GetSubjectAreasResponse>(GET_SUBJECTAREAS);
  const { data: entitiesData } = useQuery<GetEntitiesResponse>(GET_ENTITIES);
  const selectedSubjectArea = subjectAreasData?.meta_subjectarea.find(sa => sa.id === selectedSubjectAreaId);

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
      const namespace = selectedEntity.subjectarea.namespace.name;
      const subjectarea = selectedEntity.subjectarea.name;
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

  const columns = data.columns.map((col) => ({
    key: col,
    title: col,
    type: "text" as const,
    onHeaderClick: handleColumnClick,
  }));

  const entityContext = selectedEntity && selectedEntity.subjectarea && selectedEntity.subjectarea.namespace ? {
    ns: selectedEntity.subjectarea.namespace.name,
    sa: selectedEntity.subjectarea.name,
    en: selectedEntity.name,
    ns_id: selectedEntity.subjectarea.namespace.id,
    sa_id: selectedEntity.subjectarea.id,
    en_id: selectedEntity.id,
  } : null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] fixed left-64 right-0 top-14">
      <SubSidebar
        namespaceType="staging"
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
                      Staging
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
              <h1 className="text-2xl font-bold text-foreground">Staging Management</h1>
              <p className="text-muted-foreground">
                Manage staging models and data processing workflows
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
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSubjectAreaId(null);
                }}
                title="Reset search and filters"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <EntityGrid
              subjectAreaId={selectedSubjectAreaId || undefined}
              namespaceType="staging"
              searchQuery={searchQuery}
              onEntityClick={setSelectedEntity}
            />
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
                  {selectedEntity.subjectarea?.namespace?.name || 'Unknown'}.{selectedEntity.subjectarea?.name || 'Unknown'}
                </p>
              </div>
            </div>
            
            {data.rows.length === 0 ? (
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
                    <Button variant="outline" size="sm" onClick={fetchData}>
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <DataTable columns={columns} data={data.rows} />
              </div>
            )}
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