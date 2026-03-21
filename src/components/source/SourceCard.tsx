import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  RefreshCw, Trash2, Eye, Link2, ChevronRight, Timer, Calendar,
  FolderSearch, Database, FileText, Cloud, CheckCircle2, AlertCircle, Loader2
} from "lucide-react";
import SchedulingPanel, { type DataAsset, type AssetTask, type TaskDependency } from "./SchedulingPanel";
import { cn } from "@/lib/utils";

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
  entity: { ns: string; sa: string; en: string };
  connectionProfile?: string;
  lastLoaded?: string;
  status: "ready" | "loading" | "error" | "new";
  rowCount?: number;
  asset?: DataAsset;
  tasks?: AssetTask[];
  dependencies?: TaskDependency[];
}

interface ConnectionProfile {
  name: string;
  type: string;
  status: string;
}

interface SourceCardProps {
  source: SourceConfig;
  connectionProfiles: ConnectionProfile[];
  availableTasks: AssetTask[];
  onReload: (source: SourceConfig) => void;
  onConnectionChange: (sourceId: string, profileId: string) => void;
  onPreview: (source: SourceConfig) => void;
  onDelete: (sourceId: string) => void;
  onAssetChange: (sourceId: string, update: Partial<DataAsset>) => void;
  onTaskAdd: (sourceId: string, task: Partial<AssetTask>) => void;
  onTaskUpdate: (sourceId: string, taskId: string, update: Partial<AssetTask>) => void;
  onTaskDelete: (sourceId: string, taskId: string) => void;
}

const statusConfig = {
  ready: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-500", label: "Ready" },
  loading: { icon: Loader2, color: "text-blue-600", bg: "bg-blue-500", label: "Loading" },
  error: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive", label: "Error" },
  new: { icon: Database, color: "text-muted-foreground", bg: "bg-muted-foreground", label: "New" },
};

const kindIcons: Record<string, typeof FileText> = {
  "file.csv": FileText,
  "file.parquet": Database,
  "file.json": FileText,
  "file.fixedwidth": FileText,
  "file.pdf": FileText,
  "db.duckdb": Database,
  "db.databricks": Cloud,
  "db.postgres": Database,
};

export default function SourceCard({
  source,
  connectionProfiles,
  availableTasks,
  onReload,
  onConnectionChange,
  onPreview,
  onDelete,
  onAssetChange,
  onTaskAdd,
  onTaskUpdate,
  onTaskDelete,
}: SourceCardProps) {
  const [schedulingOpen, setSchedulingOpen] = useState(false);

  const status = statusConfig[source.status];
  const StatusIcon = status.icon;
  const KindIcon = kindIcons[source.kind] || Database;
  const activeTasks = source.tasks?.filter((t) => t.enabled).length || 0;

  return (
    <Card className="card-hover">
      <CardContent className="p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <KindIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{source.name}</span>
                <Badge variant="outline" className="text-xs">{source.kind}</Badge>
                {source.kind.startsWith("db.") && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Database className="w-3 h-3" />
                    External
                  </Badge>
                )}
                <div className="flex items-center gap-1.5">
                  <div className={cn("w-2 h-2 rounded-full", status.bg)} />
                  <span className={cn("text-xs", status.color)}>{status.label}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {source.entity.ns}.{source.entity.sa}.{source.entity.en}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onReload(source)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPreview(source)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(source.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Details Row */}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          {source.rowCount !== undefined && (
            <span>{source.rowCount.toLocaleString()} rows</span>
          )}
          {source.lastLoaded && (
            <span>Last loaded: {source.lastLoaded}</span>
          )}
          {activeTasks > 0 && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Timer className="w-3 h-3" />
              {activeTasks} task{activeTasks !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Connection Profile */}
        <div className="mt-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select
            value={source.connectionProfile || ""}
            onValueChange={(v) => onConnectionChange(source.id, v)}
          >
            <SelectTrigger className="input-enhanced h-8 text-xs">
              <SelectValue placeholder="Select connection..." />
            </SelectTrigger>
            <SelectContent>
              {connectionProfiles.map((p) => (
                <SelectItem key={p.name} value={p.name}>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        p.status === "active" ? "bg-green-500" : "bg-muted-foreground"
                      )}
                    />
                    <span>{p.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Scheduling Collapsible */}
        <Collapsible open={schedulingOpen} onOpenChange={setSchedulingOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="mt-3 gap-2 text-xs w-full justify-start text-muted-foreground hover:text-foreground">
              <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", schedulingOpen && "rotate-90")} />
              <Timer className="h-3.5 w-3.5" />
              Scheduling ({source.tasks?.length || 0} tasks)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="collapsible-content mt-2">
            <SchedulingPanel
              entityId={source.entity.en}
              entityFqn={`${source.entity.ns}.${source.entity.sa}.${source.entity.en}`}
              asset={source.asset}
              tasks={source.tasks || []}
              availableTasks={availableTasks}
              onAssetChange={(update) => onAssetChange(source.id, update)}
              onTaskAdd={(task) => onTaskAdd(source.id, task)}
              onTaskUpdate={(taskId, update) => onTaskUpdate(source.id, taskId, update)}
              onTaskDelete={(taskId) => onTaskDelete(source.id, taskId)}
            />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
