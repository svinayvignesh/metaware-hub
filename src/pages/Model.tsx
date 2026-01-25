import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { SubSidebar } from "@/components/layout/SubSidebar";
import { EntityGrid } from "@/components/entity/EntityGrid";
import { DataTable } from "@/components/table/DataTable";
import { useMDConnectionContext } from "@/contexts/MDConnectionContext";
import { queryMDTable } from "@/hooks/useMDConnection";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Database, Loader2, Hammer, BarChart3, ArrowLeft } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { GET_SUBJECTAREAS, type GetSubjectAreasResponse } from "@/graphql/queries";
import { useLayout } from "@/context/LayoutContext";

export default function Model() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSubjectAreaId, setSelectedSubjectAreaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const { connection, connect, ready } = useMDConnectionContext();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ columns: string[]; rows: any[] }>({ columns: [], rows: [] });

  const { data: subjectAreasData } = useQuery<GetSubjectAreasResponse>(GET_SUBJECTAREAS);

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

  // Handle navigation state (from BuildModels)
  useEffect(() => {
    if (location.state?.selectedEntity) {
      setSelectedEntity(location.state.selectedEntity);
      // Clear the navigation state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (ready && connection && selectedEntity) {
      fetchData();
    }
  }, [ready, connection, selectedEntity]);

  // Reset selected entity when subject area changes
  useEffect(() => {
    setSelectedEntity(null);
  }, [selectedSubjectAreaId]);

  const fetchData = async () => {
    if (!connection || !selectedEntity || !selectedEntity.subjectarea || !selectedEntity.subjectarea.namespace) return;

    setLoading(true);
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
    <div
      className="flex h-[calc(100vh-3.5rem)] fixed right-0 top-14 transition-[left] duration-300 ease-in-out"
      style={{ left: sidebarWidth }}
    >
      <SubSidebar
        namespaceType="model"
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
                          <BarChart3 className="w-6 h-6 text-primary-foreground" />
                        </div>
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight">Data Model</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">Manage and explore data models and schemas</span>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => navigate("/build-models")} className="flex items-center gap-2 rounded-xl">
                      <Hammer className="h-4 w-4" />
                      Build Models
                    </Button>
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
                namespaceType="model"
                searchQuery={searchQuery}
                onEntityClick={setSelectedEntity}
              />
            </div>
          </div>
        ) : !ready ? (
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
            <div className="flex-1 px-4">

              {data.rows.length === 0 ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="text-center space-y-2">
                    <Database className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No data found</p>
                    <Button variant="outline" size="sm" onClick={fetchData}>
                      Retry
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden">
                  <DataTable columns={columns} data={data.rows} onRefresh={fetchData} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div >
  );
}