import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SubSidebar } from "@/components/layout/SubSidebar";
import { EntityGrid } from "@/components/entity/EntityGrid";
import { DataTable } from "@/components/table/DataTable";
import { useMDConnectionContext } from "@/contexts/MDConnectionContext";
import { queryMDTable } from "@/hooks/useMDConnection";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Database, Loader2, Hammer } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";

export default function Model() {
  const navigate = useNavigate();
  const [selectedSubjectAreaId, setSelectedSubjectAreaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const { connection, connect, ready } = useMDConnectionContext();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ columns: string[]; rows: any[] }>({ columns: [], rows: [] });

  // Connect to database on mount
  useEffect(() => {
    connect();
  }, [connect]);

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
    if (!connection || !selectedEntity) return;

    setLoading(true);
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
    <div className="flex h-[calc(100vh-3.5rem)] fixed left-64 right-0 top-14">
      <SubSidebar
        namespaceType="model"
        onSubjectAreaSelect={setSelectedSubjectAreaId}
        selectedSubjectAreaId={selectedSubjectAreaId || undefined}
      />
      
      <div className="flex-1 overflow-hidden">
        {!selectedEntity ? (
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Model</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Data Model</h1>
                <p className="text-muted-foreground">
                  Manage and explore data models and schemas
                </p>
              </div>
              <Button onClick={() => navigate("/build-models")} className="flex items-center gap-2">
                <Hammer className="h-4 w-4" />
                Build Models
              </Button>
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
              namespaceType="model"
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
                    <Link to="/model">Data Model</Link>
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
                  {selectedEntity.subjectarea.namespace.name}.{selectedEntity.subjectarea.name}
                </p>
              </div>
            </div>
            
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
                <DataTable columns={columns} data={data.rows} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}