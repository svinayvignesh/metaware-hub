import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash2, Timer, Calendar, Zap, Link2, Clock, FolderSearch } from "lucide-react";
import { cn } from "@/lib/utils";

// === Exported Types ===

export interface DataAsset {
  id: string;
  name: string;
  asset_key: string;
  entity_id: string;
  asset_type: string;
  asset_group?: string;
  enabled: boolean;
  description?: string;
  partitioned: boolean;
}

export interface AssetTask {
  id: string;
  asset_id: string;
  task_key: string;
  name: string;
  task_type: string;
  trigger_type?: "schedule" | "file_sensor" | "dependency";
  trigger_config?: Record<string, any>;
  execution_config?: Record<string, any>;
  enabled: boolean;
  description?: string;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  auto_detected?: boolean;
}

// === Component ===

interface SchedulingPanelProps {
  entityId: string;
  entityFqn: string;
  asset?: DataAsset;
  tasks: AssetTask[];
  availableTasks?: AssetTask[];
  onAssetChange: (update: Partial<DataAsset>) => void;
  onTaskAdd: (task: Partial<AssetTask>) => void;
  onTaskUpdate: (taskId: string, update: Partial<AssetTask>) => void;
  onTaskDelete: (taskId: string) => void;
}

export default function SchedulingPanel({
  entityId,
  entityFqn,
  asset,
  tasks,
  availableTasks = [],
  onAssetChange,
  onTaskAdd,
  onTaskUpdate,
  onTaskDelete,
}: SchedulingPanelProps) {
  const [newTriggerType, setNewTriggerType] = useState<"schedule" | "file_sensor" | "dependency">("schedule");

  const addTask = () => {
    const base: Partial<AssetTask> = {
      id: `at_${Date.now()}`,
      task_key: `task_${Date.now()}`,
      name: "",
      task_type: "python",
      trigger_type: newTriggerType,
      enabled: true,
    };

    if (newTriggerType === "schedule") {
      base.trigger_config = { cron: "0 0 * * *", timezone: "UTC" };
    } else if (newTriggerType === "file_sensor") {
      base.trigger_config = { watch_path: "", file_pattern: "*.*" };
    } else if (newTriggerType === "dependency") {
      base.trigger_config = { depends_on_task_id: "" };
    }

    onTaskAdd(base);
  };

  return (
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" />
          Scheduling & Triggers
        </CardTitle>
        <CardDescription>Configure automated task execution and dependencies</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Asset-level settings */}
        {asset && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Asset Enabled</Label>
                <p className="text-xs text-muted-foreground">Enable or disable the entire asset</p>
              </div>
              <Switch
                checked={asset.enabled}
                onCheckedChange={(v) => onAssetChange({ enabled: v })}
              />
            </div>
            <Separator />
          </>
        )}

        {/* Existing Tasks */}
        {tasks.map((task, i) => (
          <div key={task.id || i} className="border rounded-lg p-4 space-y-3 relative bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {task.trigger_type === "schedule" && (
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="w-3 h-3" />
                    Schedule
                  </Badge>
                )}
                {task.trigger_type === "file_sensor" && (
                  <Badge variant="outline" className="gap-1">
                    <FolderSearch className="w-3 h-3" />
                    File Sensor
                  </Badge>
                )}
                {task.trigger_type === "dependency" && (
                  <Badge variant="outline" className="gap-1">
                    <Link2 className="w-3 h-3" />
                    Dependency
                  </Badge>
                )}
                <Switch
                  checked={task.enabled}
                  onCheckedChange={(v) => onTaskUpdate(task.id, { enabled: v })}
                />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onTaskDelete(task.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Task Name</Label>
                <Input
                  value={task.name}
                  onChange={(e) => onTaskUpdate(task.id, { name: e.target.value })}
                  className="input-enhanced h-9"
                  placeholder="e.g. daily_load"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Task Key</Label>
                <Input
                  value={task.task_key}
                  onChange={(e) => onTaskUpdate(task.id, { task_key: e.target.value })}
                  className="input-enhanced h-9"
                  placeholder="unique_task_key"
                />
              </div>
            </div>

            {/* Schedule fields */}
            {task.trigger_type === "schedule" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Cron Expression</Label>
                  <Input
                    value={task.trigger_config?.cron || ""}
                    onChange={(e) =>
                      onTaskUpdate(task.id, {
                        trigger_config: { ...task.trigger_config, cron: e.target.value },
                      })
                    }
                    className="input-enhanced h-9 font-mono text-sm"
                    placeholder="0 0 * * *"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Timezone</Label>
                  <Input
                    value={task.trigger_config?.timezone || "UTC"}
                    onChange={(e) =>
                      onTaskUpdate(task.id, {
                        trigger_config: { ...task.trigger_config, timezone: e.target.value },
                      })
                    }
                    className="input-enhanced h-9"
                    placeholder="UTC"
                  />
                </div>
              </div>
            )}

            {/* File sensor fields */}
            {task.trigger_type === "file_sensor" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Watch Path</Label>
                  <Input
                    value={task.trigger_config?.watch_path || ""}
                    onChange={(e) =>
                      onTaskUpdate(task.id, {
                        trigger_config: { ...task.trigger_config, watch_path: e.target.value },
                      })
                    }
                    className="input-enhanced h-9"
                    placeholder="/data/incoming/"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">File Pattern</Label>
                  <Input
                    value={task.trigger_config?.file_pattern || ""}
                    onChange={(e) =>
                      onTaskUpdate(task.id, {
                        trigger_config: { ...task.trigger_config, file_pattern: e.target.value },
                      })
                    }
                    className="input-enhanced h-9"
                    placeholder="*.csv"
                  />
                </div>
              </div>
            )}

            {/* Dependency fields */}
            {task.trigger_type === "dependency" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Depends On Task</Label>
                <Select
                  value={task.trigger_config?.depends_on_task_id || ""}
                  onValueChange={(v) =>
                    onTaskUpdate(task.id, {
                      trigger_config: { ...task.trigger_config, depends_on_task_id: v },
                    })
                  }
                >
                  <SelectTrigger className="input-enhanced h-9">
                    <SelectValue placeholder="Select upstream task..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTasks
                      .filter((t) => t.id !== task.id)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name || t.task_key}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ))}

        {/* Add New Task */}
        <div className="flex items-center gap-2 pt-2">
          <Select value={newTriggerType} onValueChange={(v) => setNewTriggerType(v as any)}>
            <SelectTrigger className="input-enhanced h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="schedule">
                <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Schedule</span>
              </SelectItem>
              <SelectItem value="file_sensor">
                <span className="flex items-center gap-1.5"><FolderSearch className="w-3 h-3" /> File Sensor</span>
              </SelectItem>
              <SelectItem value="dependency">
                <span className="flex items-center gap-1.5"><Link2 className="w-3 h-3" /> Dependency</span>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={addTask} className="gap-1.5 h-9">
            <Plus className="h-4 w-4" /> Add Task
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
