import React, { useState, useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    ArrowRight,
    Plus,
    Trash2,
    ChevronDown,
    ChevronRight,
    Database,
    Code,
    GitMerge,
    Filter,
    Layers,
    Play,
    Settings,
    Sparkles,
    Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { rulesetAPI } from "@/services/api";
import { GET_META_FOR_ENTITY, type MetaField } from "@/graphql/queries/meta";
import { GET_RULESETS_BY_ENTITY, type RulesetWithSource, type Ruleset as RulesetType, type Rule as RuleType } from "@/graphql/queries/ruleset";

type TransformOperation = "filter" | "aggregate" | "join" | "union" | "normalize" | "custom";

interface ColumnMapping {
    id: string;
    expression: string;
    targetColumn: string;
}

interface TransformConfig {
    operation: TransformOperation;
    groupBy?: string[];
    aggregations?: { column: string; function: string }[];
    filterCondition?: string;
    joinType?: string;
    joinCondition?: string;
}

interface TransformStep {
    id: string;
    name: string;
    mappings: ColumnMapping[];
    config: TransformConfig;
    icon: any;
}

interface SourceTransformationProps {
    entityContext: {
        ns: string;
        sa: string;
        en: string;
        ns_id: string;
        sa_id: string;
        en_id: string;
    };
    onBack: () => void;
}

const operationIcons = {
    filter: Filter,
    aggregate: Layers,
    join: GitMerge,
    union: Database,
    normalize: Settings,
    custom: Code
};

export const SourceTransformation: React.FC<SourceTransformationProps> = ({
    entityContext,
    onBack,
}) => {
    const { toast } = useToast();
    const [steps, setSteps] = useState<TransformStep[]>([
        {
            id: "1",
            name: "Transform Step 1",
            icon: Code,
            mappings: [],
            config: {
                operation: "custom",
            }
        }
    ]);

    const [selectedStepId, setSelectedStepId] = useState<string>(steps[0]?.id);
    const [isConfigOpen, setIsConfigOpen] = useState(true);
    const [sourceMetaFields, setSourceMetaFields] = useState<MetaField[]>([]);
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [loadingPipeline, setLoadingPipeline] = useState(!!entityContext.en_id);
    const [existingRulesetId, setExistingRulesetId] = useState<string | null>(null);

    // Helper: extract clean target column name from rule
    // Priority: meta.name (original column) > strip step suffix from name > alias
    const extractTargetColumn = (rule: RuleType, stepName: string): string => {
        if (rule.meta?.name) return rule.meta.name;
        // rule.name is like "marriot_transaction_id_Step Name" - strip suffix
        if (rule.name && stepName) {
            const suffix = `_${stepName}`;
            if (rule.name.endsWith(suffix)) {
                return rule.name.slice(0, -suffix.length);
            }
        }
        return rule.alias || rule.name;
    };

    // Helper: hydrate TransformStep[] from child rulesets
    const hydrateSteps = (childRulesets: RulesetType[]): TransformStep[] => {
        return childRulesets.map((child: RulesetType, idx: number) => {
            const mappings: ColumnMapping[] = (child.rules || []).map(
                (rule: RuleType, rIdx: number) => ({
                    id: `loaded-${idx}-${rIdx}`,
                    expression: rule.rule_expression,
                    targetColumn: extractTargetColumn(rule, child.name),
                })
            );
            // Map server transform type to client operation
            const transformType = child.transform?.type;
            const operation: TransformOperation =
                transformType === "filter" ? "filter"
                : transformType === "aggregator" ? "aggregate"
                : "custom";
            const icon = operationIcons[operation] || Code;
            // Extract transform config (group_by, filter_expression)
            const transformConfig = child.transform?.transform_config || {};
            const config: TransformConfig = { operation };
            if (operation === "aggregate" && transformConfig.group_by) {
                config.groupBy = transformConfig.group_by.split(",").map((s: string) => s.trim());
            }
            if (operation === "filter" && transformConfig.filter_expression) {
                config.filterCondition = transformConfig.filter_expression;
            }
            return {
                id: `step-${idx}`,
                name: child.name,
                mappings,
                config,
                icon,
            };
        });
    };

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

    const [fetchExistingRulesets] = useLazyQuery(GET_RULESETS_BY_ENTITY, {
        fetchPolicy: "network-only",
        onCompleted: (data) => {
            if (data?.meta_ruleset && data.meta_ruleset.length > 0) {
                // Find a pipeline-type ruleset (has child_rulesets)
                const pipeline = data.meta_ruleset.find(
                    (rs: RulesetWithSource) =>
                        rs.subtype === "pipeline" && rs.child_rulesets && rs.child_rulesets.length > 0
                );
                if (pipeline) {
                    setExistingRulesetId(pipeline.id);
                    const hydratedSteps = hydrateSteps(pipeline.child_rulesets!);
                    if (hydratedSteps.length > 0) {
                        setSteps(hydratedSteps);
                        setSelectedStepId(hydratedSteps[0].id);
                    }
                }
            }
            setLoadingPipeline(false);
        },
        onError: (error) => {
            console.error("Error fetching existing rulesets:", error);
            toast({
                title: "Warning",
                description: "Could not load existing pipeline. You can still create a new one.",
            });
            setLoadingPipeline(false);
        },
    });

    useEffect(() => {
        if (entityContext.en_id) {
            setLoadingPipeline(true);
            fetchSourceMeta({ variables: { enid: entityContext.en_id } });
            fetchExistingRulesets({
                variables: { targetEnId: entityContext.en_id, type: "source_transform" },
            });
        } else {
            setLoadingPipeline(false);
        }
    }, [entityContext.en_id, fetchSourceMeta, fetchExistingRulesets]);

    const selectedStep = steps.find(s => s.id === selectedStepId);

    const addStep = () => {
        const newStep: TransformStep = {
            id: Date.now().toString(),
            name: `Transform Step ${steps.length + 1}`,
            icon: Code,
            mappings: [],
            config: { operation: "custom" }
        };
        setSteps([...steps, newStep]);
        setSelectedStepId(newStep.id);
    };

    const deleteStep = (stepId: string) => {
        const filtered = steps.filter(s => s.id !== stepId);
        setSteps(filtered);
        if (selectedStepId === stepId && filtered.length > 0) {
            setSelectedStepId(filtered[0].id);
        }
    };

    const addMapping = () => {
        if (!selectedStep) return;
        const newMapping: ColumnMapping = {
            id: Date.now().toString(),
            expression: "",
            targetColumn: ""
        };
        const updated = steps.map(s =>
            s.id === selectedStepId
                ? { ...s, mappings: [...s.mappings, newMapping] }
                : s
        );
        setSteps(updated);
    };

    const autoFillMappings = () => {
        if (!selectedStep || sourceMetaFields.length === 0) return;
        const autoMappings: ColumnMapping[] = sourceMetaFields.map((field, idx) => ({
            id: `auto-${idx}`,
            expression: field.alias,
            targetColumn: field.alias
        }));
        const updated = steps.map(s =>
            s.id === selectedStepId
                ? { ...s, mappings: autoMappings }
                : s
        );
        setSteps(updated);
    };

    const updateMapping = (mappingId: string, field: keyof ColumnMapping, value: string) => {
        const updated = steps.map(s =>
            s.id === selectedStepId
                ? {
                    ...s,
                    mappings: s.mappings.map(m =>
                        m.id === mappingId ? { ...m, [field]: value } : m
                    )
                }
                : s
        );
        setSteps(updated);
    };

    const deleteMapping = (mappingId: string) => {
        const updated = steps.map(s =>
            s.id === selectedStepId
                ? { ...s, mappings: s.mappings.filter(m => m.id !== mappingId) }
                : s
        );
        setSteps(updated);
    };

    const updateConfig = (field: string, value: any) => {
        const updated = steps.map(s => {
            if (s.id !== selectedStepId) return s;
            const newConfig = { ...s.config, [field]: value };
            const icon = field === "operation" ? (operationIcons[value as TransformOperation] || Code) : s.icon;
            return { ...s, config: newConfig, icon };
        });
        setSteps(updated);
    };

    const updateStepName = (stepId: string, name: string) => {
        const updated = steps.map(s =>
            s.id === stepId ? { ...s, name } : s
        );
        setSteps(updated);
    };

    const handleApplyTransformation = async () => {
        // Validate all steps have mappings
        const stepsWithoutMappings = steps.filter(s => s.mappings.length === 0);
        if (stepsWithoutMappings.length > 0) {
            toast({
                title: "Validation Error",
                description: "All transformation steps must have at least one column mapping",
                variant: "destructive",
            });
            return;
        }

        // Validate all mappings have both expression and target column
        for (const step of steps) {
            const incompleteMappings = step.mappings.filter(m => !m.expression || !m.targetColumn);
            if (incompleteMappings.length > 0) {
                toast({
                    title: "Validation Error",
                    description: `Step "${step.name}" has incomplete mappings. Both expression and target column are required.`,
                    variant: "destructive",
                });
                return;
            }
        }

        setSaving(true);
        try {
            // Build child_rulesets from steps
            const childRulesets = steps.map((step, index) => ({
                sequence: index + 1,
                step_type: "ruleset",
                inline_ruleset: {
                    name: step.name,
                    description: step.name,
                    type: "glossary_association",
                    rule_requests: step.mappings.map((mapping) => ({
                        meta: mapping.targetColumn,
                        rule_expression: mapping.expression,
                        name: `${mapping.targetColumn}_${step.name}`,
                        description: `${mapping.targetColumn}_${step.name}`,
                        language: "sql",
                        rule_status: "active",
                        subtype: ".",
                        type: "glossary",
                    })),
                    transform_request: {
                        strategy: "sql",
                        type: step.config.operation === "aggregate" ? "aggregator"
                            : step.config.operation === "filter" ? "filter"
                            : "passive",
                        name: step.name,
                        status: "Active",
                        transform_config: step.config.operation === "aggregate" && step.config.groupBy
                            ? { group_by: step.config.groupBy.filter(Boolean).join(", ") }
                            : step.config.operation === "filter" && step.config.filterCondition
                            ? { filter_expression: step.config.filterCondition }
                            : {},
                    },
                },
            }));

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
                ruleset_request: {
                    name: `${entityContext.ns}_${entityContext.sa}_${entityContext.en}_pipeline_ruleset`,
                    description: `${steps.length}-step pipeline transformation`,
                    type: "source_transform",
                    subtype: "pipeline",
                    language: "sql",
                    child_rulesets: childRulesets,
                },
                source_request: {
                    type: "DIRECT",
                    source_ns: entityContext.ns,
                    source_sa: entityContext.sa,
                    source_en: entityContext.en,
                },
            };

            await rulesetAPI.create(payload);

            toast({
                title: "Success",
                description: "Transformation pipeline created successfully",
            });

            // Optionally go back or reset
            // onBack();
        } catch (error) {
            console.error("❌ Error creating ruleset:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create transformation",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loadingPipeline) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading existing pipeline...
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="space-y-6 overflow-y-auto p-4">
                {/* Transformation Flow */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Play className="w-5 h-5 text-primary" />
                            Transformation Pipeline
                            {existingRulesetId && (
                                <Badge variant="secondary" className="text-xs">Existing</Badge>
                            )}
                        </h2>
                        <Button onClick={addStep} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Step
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 overflow-x-auto pb-4">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center gap-4 flex-shrink-0">
                                <Card
                                    className={`p-4 cursor-pointer transition-all min-w-[200px] ${selectedStepId === step.id
                                        ? "border-primary border-2 shadow-lg"
                                        : "hover:border-primary/50"
                                        }`}
                                    onClick={() => setSelectedStepId(step.id)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <step.icon className="w-4 h-4 text-primary" />
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {step.config.operation}
                                            </Badge>
                                        </div>
                                        {steps.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteStep(step.id);
                                                }}
                                                className="h-6 w-6 p-0"
                                            >
                                                <Trash2 className="w-3 h-3 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                    <Input
                                        value={step.name}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            updateStepName(step.id, e.target.value);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="font-medium text-sm mb-2"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {step.mappings.length} mapping{step.mappings.length !== 1 ? 's' : ''}
                                    </p>
                                </Card>
                                {index < steps.length - 1 && (
                                    <ArrowRight className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                {selectedStep && (
                    <div className="space-y-6">
                        {/* Transform Configuration */}
                        <Collapsible open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                            <Card className="overflow-hidden">
                                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-primary" />
                                        <h3 className="font-semibold">Transform Configuration</h3>
                                        <Badge variant="secondary">{selectedStep.config.operation}</Badge>
                                    </div>
                                    {isConfigOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <div className="p-4 border-t space-y-4">
                                        <Tabs defaultValue="operation" className="w-full">
                                            <TabsList className="grid w-full grid-cols-3">
                                                <TabsTrigger value="operation">Operation</TabsTrigger>
                                                <TabsTrigger value="filters">Filters</TabsTrigger>
                                                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="operation" className="space-y-4">
                                                <div>
                                                    <Label>Operation Type</Label>
                                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                                        {Object.entries(operationIcons).map(([op, Icon]) => (
                                                            <Button
                                                                key={op}
                                                                variant={selectedStep.config.operation === op ? "default" : "outline"}
                                                                onClick={() => updateConfig("operation", op)}
                                                                className="justify-start"
                                                            >
                                                                <Icon className="w-4 h-4 mr-2" />
                                                                {op.charAt(0).toUpperCase() + op.slice(1)}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {selectedStep.config.operation === "filter" && (
                                                    <div>
                                                        <Label>Filter Condition</Label>
                                                        <Input
                                                            placeholder="status = 'ACTIVE'"
                                                            value={selectedStep.config.filterCondition || ""}
                                                            onChange={(e) => updateConfig("filterCondition", e.target.value)}
                                                        />
                                                    </div>
                                                )}

                                                {selectedStep.config.operation === "aggregate" && (
                                                    <div>
                                                        <Label>Group By Columns</Label>
                                                        <Input
                                                            placeholder="column1, column2"
                                                            value={selectedStep.config.groupBy?.join(", ") || ""}
                                                            onChange={(e) => updateConfig("groupBy", e.target.value.split(",").map(s => s.trim()))}
                                                        />
                                                    </div>
                                                )}

                                                {selectedStep.config.operation === "join" && (
                                                    <>
                                                        <div>
                                                            <Label>Join Type</Label>
                                                            <Input
                                                                placeholder="INNER, LEFT, RIGHT, FULL"
                                                                value={selectedStep.config.joinType || ""}
                                                                onChange={(e) => updateConfig("joinType", e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>Join Condition</Label>
                                                            <Input
                                                                placeholder="a.customer_id = b.customer_id"
                                                                value={selectedStep.config.joinCondition || ""}
                                                                onChange={(e) => updateConfig("joinCondition", e.target.value)}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </TabsContent>

                                            <TabsContent value="filters" className="space-y-4">
                                                <div>
                                                    <Label>Filter Condition (WHERE clause)</Label>
                                                    <Textarea
                                                        placeholder="status = 'ACTIVE' AND order_date >= '2024-01-01'"
                                                        value={selectedStep.config.filterCondition || ""}
                                                        onChange={(e) => updateConfig("filterCondition", e.target.value)}
                                                        rows={3}
                                                    />
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="advanced" className="space-y-4">
                                                <div>
                                                    <Label>Custom SQL</Label>
                                                    <Textarea
                                                        placeholder="Enter custom SQL transformations..."
                                                        className="font-mono text-sm"
                                                        rows={5}
                                                    />
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                </CollapsibleContent>
                            </Card>
                        </Collapsible>

                        {/* Column Mappings */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <GitMerge className="w-5 h-5 text-primary" />
                                    Column Mappings
                                </h3>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={autoFillMappings}>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Auto-Fill Columns
                                    </Button>
                                    <Button onClick={addMapping} size="sm">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Mapping
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {/* Header */}
                                <div className="grid grid-cols-12 gap-4 pb-2 border-b text-sm font-medium text-muted-foreground">
                                    <div className="col-span-5">Expression / Transform</div>
                                    <div className="col-span-6">Target Column</div>
                                    <div className="col-span-1"></div>
                                </div>

                                {/* Mappings */}
                                {selectedStep.mappings.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No mappings defined yet</p>
                                        <p className="text-sm mt-2">Click "Auto-Fill Columns" or "Add Mapping" to get started</p>
                                    </div>
                                ) : (
                                    selectedStep.mappings.map((mapping) => (
                                        <div key={mapping.id} className="grid grid-cols-12 gap-4 items-center group">
                                            <div className="col-span-5 flex items-center gap-2">
                                                {sourceMetaLoading ? (
                                                    <div className="flex items-center gap-2 text-muted-foreground flex-1">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Loading...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Input
                                                            placeholder="UPPER(column) or expression"
                                                            value={mapping.expression}
                                                            onChange={(e) => updateMapping(mapping.id, "expression", e.target.value)}
                                                            className="font-mono text-sm bg-accent/10 flex-1"
                                                        />
                                                        <Popover
                                                            open={openPopoverId === mapping.id}
                                                            onOpenChange={(open) => setOpenPopoverId(open ? mapping.id : null)}
                                                        >
                                                            <PopoverTrigger asChild>
                                                                <Button variant="outline" size="icon" className="shrink-0">
                                                                    <ChevronDown className="w-4 h-4" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-64 p-2" align="end">
                                                                <div className="space-y-1">
                                                                    {sourceMetaFields.map((meta) => (
                                                                        <Button
                                                                            key={meta.id}
                                                                            variant="ghost"
                                                                            className="w-full justify-start text-sm"
                                                                            onClick={() => {
                                                                                updateMapping(mapping.id, "expression", meta.alias);
                                                                                setOpenPopoverId(null);
                                                                            }}
                                                                        >
                                                                            {meta.alias}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </>
                                                )}
                                            </div>
                                            <div className="col-span-6">
                                                <Input
                                                    placeholder="target_column"
                                                    value={mapping.targetColumn}
                                                    onChange={(e) => updateMapping(mapping.id, "targetColumn", e.target.value)}
                                                    className="font-mono text-sm"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deleteMapping(mapping.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {selectedStep.mappings.length > 0 && (
                                <div className="mt-6 pt-6 border-t">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-muted-foreground">
                                            {selectedStep.mappings.length} mapping{selectedStep.mappings.length !== 1 ? "s" : ""} defined
                                        </p>
                                        <Button onClick={handleApplyTransformation} disabled={saving}>
                                            {saving ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Applying...
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4 mr-2" />
                                                    Apply Transformation
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};
