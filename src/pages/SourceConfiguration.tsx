import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import {
  ArrowLeft, Database, FileText, Code, Cloud, Upload, Settings2,
  Link2, FileUp, Loader2,
  FolderOpen, Zap, Table, Eye, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import GlossaryEntitySelector, { type SelectedEntity } from "@/components/glossary/GlossaryEntitySelector";
import SourceCard from "@/components/source/SourceCard";
import SchedulingPanel, { type DataAsset, type AssetTask, type TaskDependency } from "@/components/source/SchedulingPanel";
import ConnectionProfileModal from "@/components/source/ConnectionProfileModal";
import { orchestrationAPI, connectionProfileAPI, metaAPI, type ConnectionProfile } from "@/services/api";
import { GET_ORCHESTRATION, type GetOrchestrationResponse, type OrchestrationAsset } from "@/graphql/queries/orchestration";
import { cn } from "@/lib/utils";

// Source kind types based on runtime config
type SourceKind =
  | "file.csv"
  | "file.parquet"
  | "file.json"
  | "file.fixedwidth"
  | "file.pdf"
  | "db.duckdb"
  | "db.databricks"
  | "db.postgres";

interface SourceConfig {
  id: string;
  name: string;
  kind: SourceKind;
  entity: SelectedEntity;
  connectionProfile?: string;
  lastLoaded?: string;
  status: "ready" | "loading" | "error" | "new";
  rowCount?: number;
  asset?: DataAsset;
  tasks?: AssetTask[];
  dependencies?: TaskDependency[];
}

interface ParserConfig {
  kind: SourceKind;
  source_path?: string;
  file_name?: string;
  delimiter?: string;
  encoding?: string;
  header?: boolean;
  skip_rows?: number;
  infer_schema?: boolean;
  parser_engine?: string;
  batch_size?: number;
  parallelism?: number;
}

interface LoaderConfig {
  kind: SourceKind;
  strategy?: string;
  batch_size?: number;
  parallelism?: number;
  dry_run?: boolean;
  profile?: string;
}

const SourceConfiguration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Entity selection
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);

  // Source kind selection
  const [selectedKind, setSelectedKind] = useState<SourceKind | null>(null);

  // Connection profile
  const [connectionProfile, setConnectionProfile] = useState<string>("");
  const [connectionProfiles, setConnectionProfiles] = useState<ConnectionProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // External DB source configuration
  // source_database is derived from connectionProfile name (connection profile name = database name)
  const [sourceSchema, setSourceSchema] = useState<string>("");
  const [sourceTable, setSourceTable] = useState<string>("");
  const [availableSchemas, setAvailableSchemas] = useState<string[]>([]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isDetectingSchema, setIsDetectingSchema] = useState(false);
  const [detectedMeta, setDetectedMeta] = useState<any[] | null>(null);


  // Runtime configuration
  const [parserConfig, setParserConfig] = useState<ParserConfig>({
    kind: "file.csv",
    delimiter: ",",
    encoding: "utf-8",
    header: true,
    skip_rows: 0,
    infer_schema: true,
    parser_engine: "duck",
    batch_size: 1000,
    parallelism: 1,
  });

  const [loaderConfig, setLoaderConfig] = useState<LoaderConfig>({
    kind: "db.duckdb",
    strategy: "delete_and_insert",
    batch_size: 1000,
    parallelism: 1,
    dry_run: false,
  });

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [runtimePanelOpen, setRuntimePanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"existing" | "upload">("existing");

  // New source scheduling state
  const [newSourceAsset, setNewSourceAsset] = useState<Partial<DataAsset>>({
    name: "",
    asset_type: "staging",
    enabled: true,
    partitioned: false,
  });
  const [newSourceTasks, setNewSourceTasks] = useState<Partial<AssetTask>[]>([]);

  // Fetch existing orchestration from GraphQL
  const { data: orchestrationData, loading: orchestrationLoading, refetch: refetchOrchestration } = useQuery<GetOrchestrationResponse>(GET_ORCHESTRATION);

  // Map orchestration assets to SourceConfig
  const existingSources: SourceConfig[] = useMemo(() => {
    if (!orchestrationData?.orchestration_data_asset) return [];
    return orchestrationData.orchestration_data_asset.map((asset: OrchestrationAsset) => {
      // Priority: 1) entityFqn from asset, 2) build from entity hierarchy, 3) parse from description
      let ns = "";
      let sa = "";
      let en = "";
      let ns_id = "";

      if (asset.entityFqn) {
        // Use entityFqn directly if available
        const fqnParts = asset.entityFqn.split(".");
        ns = fqnParts[0] || "";
        sa = fqnParts[1] || "";
        en = fqnParts[2] || asset.name || "";
      } else if (asset.entity?.subjectarea?.namespace) {
        // Build from entity hierarchy
        ns = asset.entity.subjectarea.namespace.name || "";
        sa = asset.entity.subjectarea.name || "";
        en = asset.entity.name || asset.name || "";
        ns_id = asset.entity.subjectarea.ns_id || "";
      } else {
        // Fallback: extract FQN from description (legacy support)
        const descMatch = asset.description?.match(/for\s+(\S+)$/);
        const fqnParts = descMatch ? descMatch[1].split(".") : [];
        ns = fqnParts[0] || "";
        sa = fqnParts[1] || asset.assetGroup || "";
        en = fqnParts[2] || asset.name || "";
      }

      return {
        id: asset.id,
        name: asset.name,
        kind: "file.csv" as SourceKind,
        entity: {
          ns,
          sa,
          en,
          ns_id,
          sa_id: asset.entity?.sa_id || "",
          en_id: asset.entityId,
        },
        connectionProfile: "",
        status: "ready" as const,
        asset: {
          id: asset.id,
          name: asset.name,
          asset_key: asset.assetKey,
          entity_id: asset.entityId,
          asset_type: asset.assetType,
          asset_group: asset.assetGroup,
          enabled: asset.enabled,
          partitioned: asset.partitioned,
        },
        tasks: asset.tasks?.map(t => ({
          id: t.id,
          asset_id: t.assetId,
          task_key: t.taskKey,
          name: t.name,
          task_type: t.taskType,
          trigger_type: t.triggerType as AssetTask["trigger_type"],
          trigger_config: t.triggerConfig || {},
          execution_config: t.executionConfig || {},
          enabled: t.enabled,
        })) || [],
      };
    });
  }, [orchestrationData]);

  // Fetch connection profiles when DB source kind selected
  useEffect(() => {
    if (selectedKind?.startsWith("db.")) {
      setIsLoadingProfiles(true);
      connectionProfileAPI.list(selectedKind)
        .then(res => setConnectionProfiles(res.return_data || []))
        .catch(() => toast({ title: "Error", description: "Failed to load connection profiles", variant: "destructive" }))
        .finally(() => setIsLoadingProfiles(false));
    } else {
      setConnectionProfiles([]);
    }
  }, [selectedKind]);

  // Fetch schemas when connection profile is selected (for DB sources)
  useEffect(() => {
    if (connectionProfile && selectedKind?.startsWith("db.")) {
      setIsLoadingSchemas(true);
      setAvailableSchemas([]);
      setSourceSchema("");
      setAvailableTables([]);
      setSourceTable("");
      setDetectedMeta(null);
      connectionProfileAPI.listSchemas(connectionProfile)
        .then(res => {
          setAvailableSchemas(res.return_data || []);
        })
        .catch((err) => toast({
          title: "Failed to load schemas",
          description: err?.message || "Could not connect to the database",
          variant: "destructive"
        }))
        .finally(() => setIsLoadingSchemas(false));
    } else if (!connectionProfile) {
      setAvailableSchemas([]);
      setSourceSchema("");
      setAvailableTables([]);
      setSourceTable("");
    }
  }, [connectionProfile, selectedKind]);

  // Fetch tables when schema is selected
  useEffect(() => {
    if (connectionProfile && sourceSchema) {
      setIsLoadingTables(true);
      setAvailableTables([]);
      setSourceTable("");
      setDetectedMeta(null);
      connectionProfileAPI.listTables(connectionProfile, sourceSchema)
        .then(res => {
          setAvailableTables(res.return_data || []);
        })
        .catch((err) => toast({
          title: "Failed to load tables",
          description: err?.message || "Could not load tables for this schema",
          variant: "destructive"
        }))
        .finally(() => setIsLoadingTables(false));
    }
  }, [connectionProfile, sourceSchema]);

  // Get all tasks for dependency selection
  const allTasks = existingSources.flatMap(s => s.tasks || []);

  const sourceKinds = [
    { kind: "file.csv" as SourceKind, name: "CSV", icon: FileText, description: "Comma-separated values", category: "file" },
    { kind: "file.parquet" as SourceKind, name: "Parquet", icon: Database, description: "Columnar format", category: "file" },
    { kind: "file.json" as SourceKind, name: "JSON", icon: Code, description: "JSON / JSONL", category: "file" },
    { kind: "file.fixedwidth" as SourceKind, name: "Fixed Width", icon: FileText, description: "Fixed-width text", category: "file" },
    { kind: "file.pdf" as SourceKind, name: "PDF", icon: FileText, description: "PDF documents", category: "file" },
    { kind: "db.duckdb" as SourceKind, name: "DuckDB", icon: Database, description: "DuckDB / MotherDuck", category: "database" },
    { kind: "db.databricks" as SourceKind, name: "Databricks", icon: Cloud, description: "Databricks Unity Catalog", category: "database" },
    { kind: "db.postgres" as SourceKind, name: "PostgreSQL", icon: Database, description: "PostgreSQL database", category: "database" },
  ];


  // Auto-detect schema from external database
  const handleAutoDetectDb = async () => {
    if (!selectedEntity || !connectionProfile || !sourceSchema || !sourceTable) {
      toast({ title: "Missing Fields", description: "Select entity, connection, schema, and table.", variant: "destructive" });
      return;
    }

    setIsDetectingSchema(true);
    try {
      const result = await metaAPI.autoDetectStagingDb({
        ns: selectedEntity.ns,
        sa: selectedEntity.sa,
        en: selectedEntity.en,
        ns_type: "staging",
        source_kind: selectedKind!,
        connection_name: connectionProfile,
        source_database: connectionProfile,
        source_schema: sourceSchema,
        source_table: sourceTable,
        create_meta: true,
        primary_grain: ".",
        subtype: "external_view",
      });

      const metaFields = result.return_data?.[1] || [];
      setDetectedMeta(metaFields);

      toast({
        title: "Schema Detected",
        description: `${metaFields.length} columns detected from ${sourceSchema}.${sourceTable}. Entity created as external view.`,
      });
    } catch (err: any) {
      toast({
        title: "Detection Failed",
        description: err.message || "Failed to detect schema from external database",
        variant: "destructive",
      });
    } finally {
      setIsDetectingSchema(false);
    }
  };

  // Load staging handler - calls /mwn/configure_orchestration
  const handleLoadStaging = async () => {
    if (!selectedEntity) {
      toast({ title: "Missing Entity", description: "Please select a source entity first.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      // Build triggers from newSourceTasks
      const triggers = newSourceTasks
        .filter(t => t.trigger_type)
        .map(t => {
          const trigger: any = { trigger_type: t.trigger_type };
          if (t.trigger_type === "file_sensor") {
            trigger.file_sensor = {
              watch_path: t.trigger_config?.watch_path || "",
              file_pattern: t.trigger_config?.file_pattern || "*.*",
            };
          } else if (t.trigger_type === "schedule") {
            trigger.schedule = {
              cron_schedule: t.trigger_config?.cron || "0 0 * * *",
              timezone: t.trigger_config?.timezone || "UTC",
            };
          }
          return trigger;
        });

      const isDbSource = selectedKind?.startsWith("db.");

      const execution_config = isDbSource
        ? {
            connection_name: connectionProfile || "default",
            source_kind: selectedKind,
            source_database: connectionProfile,
            source_schema: sourceSchema,
            source_table: sourceTable,
            load_strategy: loaderConfig.strategy || "delete_and_insert",
            batch_size: loaderConfig.batch_size || 1000,
          }
        : {
            connection_name: connectionProfile || "default",
            file_format: selectedKind?.split(".")[1] || "csv",
            delimiter: parserConfig.delimiter || ",",
            encoding: parserConfig.encoding || "utf-8",
            header: parserConfig.header ?? true,
            infer_schema: parserConfig.infer_schema ?? true,
            load_strategy: loaderConfig.strategy || "delete_and_insert",
            batch_size: loaderConfig.batch_size || 1000,
          };

      const payload = {
        entity_id: selectedEntity.en_id,
        entity_fqn: `${selectedEntity.ns}.${selectedEntity.sa}.${selectedEntity.en}`,
        asset_name: selectedEntity.en,
        asset_group: selectedEntity.sa,
        asset_type: "staging",
        task_key: "load_staging",
        execution_config,
        triggers,
        discover_dependencies: true,
        regenerate_code: true,
      };

      const result = await orchestrationAPI.configure(payload);

      await refetchOrchestration();
      setActiveTab("existing");

      toast({
        title: "Orchestration Configured",
        description: `Asset: ${result.asset_id || result.id}, Task: ${result.task_id || "created"}`
      });
    } catch (err: any) {
      toast({
        title: "Configuration Failed",
        description: err.message || "Failed to configure orchestration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReloadSource = (source: SourceConfig) => {
    setSelectedEntity(source.entity);
    setSelectedKind(source.kind);
    setConnectionProfile(source.connectionProfile || "");
    setActiveTab("upload");
    toast({ title: "Source Loaded", description: `Configuration for ${source.name} loaded. Ready to reload.` });
  };

  const handleSourceConnectionChange = (_sourceId: string, _profileId: string) => {
    // TODO: persist connection profile change via API, then refetch
    toast({ title: "Connection Updated", description: "Connection profile updated for source." });
  };

  const handleSourcePreview = (source: SourceConfig) => {
    navigate(`/staging?ns=${source.entity.ns}&sa=${source.entity.sa}&en=${source.entity.en}`);
  };

  const handleSourceDelete = async (sourceId: string) => {
    try {
      await orchestrationAPI.deleteOrchestration({
        object_type: "data_asset",
        ids: [sourceId],
        cascade: true,
      });
      await refetchOrchestration();
      toast({ title: "Source Deleted", description: "Source configuration removed." });
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete source configuration",
        variant: "destructive",
      });
    }
  };

  // Asset/Task handlers for existing sources
  const handleAssetChange = (_sourceId: string, _assetUpdate: Partial<DataAsset>) => {
    // TODO: persist asset change via API, then refetch
    refetchOrchestration();
  };

  const handleTaskAdd = (_sourceId: string, task: Partial<AssetTask>) => {
    // TODO: persist task creation via API, then refetch
    refetchOrchestration();
    toast({ title: "Task Created", description: `Task "${task.name || "New Task"}" added.` });
  };

  const handleTaskUpdate = (_sourceId: string, _taskId: string, _taskUpdate: Partial<AssetTask>) => {
    // TODO: persist task update via API, then refetch
    refetchOrchestration();
  };

  const handleTaskDelete = async (_sourceId: string, taskId: string) => {
    try {
      await orchestrationAPI.deleteOrchestration({
        object_type: "asset_task",
        ids: [taskId],
        cascade: true,
      });
      await refetchOrchestration();
      toast({ title: "Task Deleted", description: "Scheduled task removed." });
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  // Stats for header
  const totalSources = existingSources.length;
  const activeTasks = existingSources.reduce((acc, s) => acc + (s.tasks?.filter(t => t.enabled).length || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Floating Header */}
      <div className="border-b border-border/50 glass sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                    <Upload className="w-5 h-5 text-primary-foreground" />
                  </div>
                  Source Configuration
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Configure and schedule staging data loads
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Stats Pills */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-3 py-1 gap-1.5">
                  <Database className="w-3 h-3" />
                  {totalSources} Sources
                </Badge>
                <Badge variant="outline" className="px-3 py-1 gap-1.5">
                  <Timer className="w-3 h-3" />
                  {activeTasks} Scheduled
                </Badge>
              </div>

              <Separator orientation="vertical" className="h-8" />

              {/* Runtime Config Panel */}
              <Sheet open={runtimePanelOpen} onOpenChange={setRuntimePanelOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Settings2 className="w-4 h-4" />
                    Runtime
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-primary" />
                      Runtime Configuration
                    </SheetTitle>
                    <SheetDescription>
                      Configure parser and loader runtime parameters
                    </SheetDescription>
                  </SheetHeader>

                  <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
                    <div className="space-y-6">
                      {/* Parser Configuration */}
                      <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          Parser Configuration
                        </h3>

                        {(selectedKind === "file.csv" || !selectedKind) && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Delimiter</Label>
                                <Select
                                  value={parserConfig.delimiter}
                                  onValueChange={(v) => setParserConfig(p => ({ ...p, delimiter: v }))}
                                >
                                  <SelectTrigger className="input-enhanced">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value=",">Comma (,)</SelectItem>
                                    <SelectItem value=";">Semicolon (;)</SelectItem>
                                    <SelectItem value="\t">Tab</SelectItem>
                                    <SelectItem value="|">Pipe (|)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Encoding</Label>
                                <Select
                                  value={parserConfig.encoding}
                                  onValueChange={(v) => setParserConfig(p => ({ ...p, encoding: v }))}
                                >
                                  <SelectTrigger className="input-enhanced">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="utf-8">UTF-8</SelectItem>
                                    <SelectItem value="utf-16">UTF-16</SelectItem>
                                    <SelectItem value="iso-8859-1">ISO-8859-1</SelectItem>
                                    <SelectItem value="ascii">ASCII</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Skip Rows</Label>
                                <Input
                                  type="number"
                                  value={parserConfig.skip_rows}
                                  onChange={(e) => setParserConfig(p => ({ ...p, skip_rows: parseInt(e.target.value) || 0 }))}
                                  className="input-enhanced"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Parser Engine</Label>
                                <Select
                                  value={parserConfig.parser_engine}
                                  onValueChange={(v) => setParserConfig(p => ({ ...p, parser_engine: v }))}
                                >
                                  <SelectTrigger className="input-enhanced">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="duck">DuckDB</SelectItem>
                                    <SelectItem value="polars">Polars</SelectItem>
                                    <SelectItem value="pandas">Pandas</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="header-switch">First row is header</Label>
                              <Switch
                                id="header-switch"
                                checked={parserConfig.header}
                                onCheckedChange={(v) => setParserConfig(p => ({ ...p, header: v }))}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="infer-switch">Infer schema</Label>
                              <Switch
                                id="infer-switch"
                                checked={parserConfig.infer_schema}
                                onCheckedChange={(v) => setParserConfig(p => ({ ...p, infer_schema: v }))}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      <Separator />

                      {/* Loader Configuration */}
                      <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Database className="w-4 h-4 text-accent" />
                          Loader Configuration
                        </h3>

                        <div className="space-y-2">
                          <Label>Load Strategy</Label>
                          <Select
                            value={loaderConfig.strategy}
                            onValueChange={(v) => setLoaderConfig(l => ({ ...l, strategy: v }))}
                          >
                            <SelectTrigger className="input-enhanced">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="delete_and_insert">Delete & Insert</SelectItem>
                              <SelectItem value="append">Append</SelectItem>
                              <SelectItem value="replace">Replace (DROP + CREATE)</SelectItem>
                              <SelectItem value="merge">Merge (UPSERT)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Batch Size</Label>
                            <Input
                              type="number"
                              value={loaderConfig.batch_size}
                              onChange={(e) => setLoaderConfig(l => ({ ...l, batch_size: parseInt(e.target.value) || 1000 }))}
                              className="input-enhanced"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Parallelism</Label>
                            <Input
                              type="number"
                              min={1}
                              max={32}
                              value={loaderConfig.parallelism}
                              onChange={(e) => setLoaderConfig(l => ({ ...l, parallelism: parseInt(e.target.value) || 1 }))}
                              className="input-enhanced"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="dry-run-switch">Dry Run</Label>
                            <p className="text-xs text-muted-foreground">Validate without executing</p>
                          </div>
                          <Switch
                            id="dry-run-switch"
                            checked={loaderConfig.dry_run}
                            onCheckedChange={(v) => setLoaderConfig(l => ({ ...l, dry_run: v }))}
                          />
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              {/* Orchestrate Button */}
              <Button
                onClick={handleLoadStaging}
                disabled={isLoading || !selectedEntity}
                className="btn-glow gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Orchestrate
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Entity & Source Selection */}
          <div className="col-span-4 space-y-6">
            {/* Entity Selection */}
            <Card className="card-hover">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Table className="w-5 h-5 text-primary" />
                  Source Entity
                </CardTitle>
                <CardDescription>Select the source entity</CardDescription>
              </CardHeader>
              <CardContent>
                <GlossaryEntitySelector
                  value={selectedEntity ? `${selectedEntity.ns}.${selectedEntity.sa}.${selectedEntity.en}` : ""}
                  onEntitySelect={(entity) => setSelectedEntity(entity)}
                />
                {selectedEntity && (
                  <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Selected Entity</p>
                    <p className="font-mono text-sm font-medium text-primary">
                      {selectedEntity.ns}.{selectedEntity.sa}.{selectedEntity.en}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Source Kind Selection */}
            <Card className="card-hover">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-accent" />
                  Source Type
                </CardTitle>
                <CardDescription>Select the source format (auto-detected from file)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">FILE SOURCES</p>
                    <div className="grid grid-cols-3 gap-2">
                      {sourceKinds.filter(s => s.category === "file").map(source => (
                        <Tooltip key={source.kind}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={selectedKind === source.kind ? "default" : "outline"}
                              className={cn(
                                "h-16 flex-col gap-1 text-xs",
                                selectedKind === source.kind && "ring-2 ring-primary ring-offset-2"
                              )}
                              onClick={() => setSelectedKind(source.kind)}
                            >
                              <source.icon className="w-4 h-4" />
                              {source.name}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{source.description}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">DATABASE SOURCES</p>
                    <div className="grid grid-cols-3 gap-2">
                      {sourceKinds.filter(s => s.category === "database").map(source => (
                        <Tooltip key={source.kind}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={selectedKind === source.kind ? "default" : "outline"}
                              className={cn(
                                "h-16 flex-col gap-1 text-xs",
                                selectedKind === source.kind && "ring-2 ring-primary ring-offset-2"
                              )}
                              onClick={() => setSelectedKind(source.kind)}
                            >
                              <source.icon className="w-4 h-4" />
                              {source.name}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{source.description}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>

                  {/* Connection Profile for Database Sources */}
                  {selectedKind?.startsWith("db.") && (
                    <div className="pt-3 mt-3 border-t border-border/50">
                      <Label className="text-xs text-muted-foreground mb-2 block">CONNECTION PROFILE</Label>
                      <Select value={connectionProfile} onValueChange={setConnectionProfile}>
                        <SelectTrigger className="input-enhanced">
                          <Link2 className="w-4 h-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder={isLoadingProfiles ? "Loading..." : "Select connection..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {connectionProfiles.map(profile => (
                              <SelectItem key={profile.name} value={profile.name}>
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    profile.status === "active" ? "bg-green-500" : "bg-muted"
                                  )} />
                                  <span>{profile.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* External Database Source Table Mapping */}
                  {selectedKind?.startsWith("db.") && connectionProfile && (
                    <div className="pt-3 mt-3 border-t border-border/50 space-y-3">
                      <Label className="text-xs text-muted-foreground mb-2 block">SOURCE TABLE MAPPING</Label>

                      <div className="space-y-1">
                        <Label className="text-xs">Schema</Label>
                        <Select value={sourceSchema} onValueChange={setSourceSchema} disabled={isLoadingSchemas}>
                          <SelectTrigger className="input-enhanced">
                            {isLoadingSchemas
                              ? <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" />Loading schemas...</span>
                              : <SelectValue placeholder={availableSchemas.length ? "Select schema..." : "No schemas found"} />
                            }
                          </SelectTrigger>
                          <SelectContent>
                            {availableSchemas.map(schema => (
                              <SelectItem key={schema} value={schema}>{schema}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Table</Label>
                        <Select value={sourceTable} onValueChange={setSourceTable} disabled={isLoadingTables || !sourceSchema}>
                          <SelectTrigger className="input-enhanced">
                            {isLoadingTables
                              ? <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" />Loading tables...</span>
                              : <SelectValue placeholder={availableTables.length ? "Select table..." : (sourceSchema ? "No tables found" : "Select schema first")} />
                            }
                          </SelectTrigger>
                          <SelectContent>
                            {availableTables.map(table => (
                              <SelectItem key={table} value={table}>{table}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        className="w-full gap-2"
                        variant="outline"
                        disabled={!sourceTable || !sourceSchema || !selectedEntity || isDetectingSchema}
                        onClick={handleAutoDetectDb}
                      >
                        {isDetectingSchema ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Table className="w-4 h-4" />
                        )}
                        Detect Schema & Create Entity
                      </Button>

                      {detectedMeta && (
                        <div className="rounded-md bg-green-50 dark:bg-green-950/20 p-3 text-sm">
                          <p className="font-medium text-green-800 dark:text-green-200">
                            {detectedMeta.length} columns detected
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Entity created with subtype 'external_view'. Raw layer will be a VIEW over the external table.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => setProfileModalOpen(true)}>
                    <Link2 className="w-4 h-4" />
                    Manage Profiles
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <Eye className="w-4 h-4" />
                    Preview Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Upload & Existing Sources */}
          <div className="col-span-8">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "existing" | "upload")}>
              <TabsList className="mb-4">
                <TabsTrigger value="existing" className="gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Existing Sources
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Configure & Schedule
                </TabsTrigger>
              </TabsList>

              <TabsContent value="existing">
                <div className="space-y-4">
                  {existingSources.map(source => (
                    <SourceCard
                      key={source.id}
                      source={source}
                      connectionProfiles={connectionProfiles}
                      availableTasks={allTasks}
                      onReload={handleReloadSource}
                      onConnectionChange={handleSourceConnectionChange}
                      onPreview={handleSourcePreview}
                      onDelete={handleSourceDelete}
                      onAssetChange={handleAssetChange}
                      onTaskAdd={handleTaskAdd}
                      onTaskUpdate={handleTaskUpdate}
                      onTaskDelete={handleTaskDelete}
                    />
                  ))}

                  {orchestrationLoading && (
                    <Card className="py-12">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">Loading schedules...</p>
                      </div>
                    </Card>
                  )}

                  {!orchestrationLoading && existingSources.length === 0 && (
                    <Card className="py-12">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <FolderOpen className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium text-lg mb-1">No sources configured</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure a source path or connect a database to get started
                        </p>
                        <Button onClick={() => setActiveTab("upload")}>
                          <Upload className="w-4 h-4 mr-2" />
                          Add Source
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-6">
                {/* Configuration Summary */}
                {(selectedEntity || selectedKind) && (
                  <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Load Configuration Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Entity</p>
                          <p className="font-mono text-sm font-medium">
                            {selectedEntity ? `${selectedEntity.ns}.${selectedEntity.sa}.${selectedEntity.en}` : "\u2014"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Source Type</p>
                          <p className="font-medium text-sm flex items-center gap-2">
                            {selectedKind ? (
                              <Badge variant="outline">{selectedKind}</Badge>
                            ) : "\u2014"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Connection</p>
                          <p className="font-medium text-sm">
                            {connectionProfile ? connectionProfiles.find(p => p.name === connectionProfile)?.name || connectionProfile : "\u2014"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {selectedKind?.startsWith("db.") ? "External Table" : "Source Path"}
                          </p>
                          <p className="font-medium text-sm truncate font-mono">
                            {selectedKind?.startsWith("db.") && sourceTable
                              ? `${sourceSchema}.${sourceTable}`
                              : newSourceTasks.find(t => t.trigger_type === "file_sensor")?.trigger_config?.watch_path || "\u2014"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Strategy</p>
                          <p className="font-medium text-sm">{loaderConfig.strategy}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Batch Size</p>
                          <p className="font-medium text-sm">{loaderConfig.batch_size?.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Scheduling Panel for New Source */}
                {selectedEntity && (
                  <SchedulingPanel
                    entityId={selectedEntity.en}
                    entityFqn={`${selectedEntity.ns}.${selectedEntity.sa}.${selectedEntity.en}`}
                    asset={newSourceAsset as DataAsset | undefined}
                    tasks={newSourceTasks as AssetTask[]}
                    availableTasks={allTasks}
                    onAssetChange={(update) => setNewSourceAsset(prev => ({ ...prev, ...update }))}
                    onTaskAdd={(task) => setNewSourceTasks(prev => [...prev, task as Partial<AssetTask>])}
                    onTaskUpdate={(taskId, update) => {
                      setNewSourceTasks(prev =>
                        prev.map(t => t.id === taskId ? { ...t, ...update } : t)
                      );
                    }}
                    onTaskDelete={(taskId) => {
                      setNewSourceTasks(prev => prev.filter(t => t.id !== taskId));
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Connection Profile Management Modal */}
      <ConnectionProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        sourceKind={selectedKind || "db.postgres"}
        onProfileCreated={() => {
          // Refresh connection profiles list
          if (selectedKind?.startsWith("db.")) {
            connectionProfileAPI.list(selectedKind)
              .then(res => setConnectionProfiles(res.return_data || []))
              .catch(() => {});
          }
        }}
      />
    </div>
  );
};

export default SourceConfiguration;
