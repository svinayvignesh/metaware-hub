import { useState, useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { API_CONFIG } from "@/config/api";
import { GET_META_RULESETS, Rule, Ruleset } from "@/graphql/queries/ruleset";

interface RuleEditorProps {
  open: boolean;
  onClose: () => void;
  columnName: string;
  entityContext: {
    ns: string;
    sa: string;
    en: string;
    ns_id: string;
    sa_id: string;
    en_id: string;
  };
}

interface LocalRule {
  name: string;
  rule_expression: string;
  subtype: "check" | "action";
  enabled: boolean;
  id?: string;
}

export function RuleEditor({ open, onClose, columnName, entityContext }: RuleEditorProps) {
  const [ruleName, setRuleName] = useState("");
  const [ruleExpression, setRuleExpression] = useState("");
  const [ruleType, setRuleType] = useState<"check" | "action">("check");
  const [localRules, setLocalRules] = useState<LocalRule[]>([]);
  const [existingRules, setExistingRules] = useState<Rule[]>([]);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const [fetchRulesets, { loading: loadingRulesets }] = useLazyQuery(GET_META_RULESETS, {
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      if (data?.meta_ruleset && data.meta_ruleset.length > 0) {
        const allRules = data.meta_ruleset.flatMap((rs: Ruleset) => rs.rules || []);
        // Filter rules for this specific column
        const columnRules = allRules.filter((rule: Rule) => rule.meta === columnName);
        setExistingRules(columnRules);
      } else {
        setExistingRules([]);
      }
    },
    onError: (error) => {
      console.error("Error fetching rulesets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch existing rules",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (open && entityContext.en_id) {
      // Fetch existing rules when editor opens
      fetchRulesets({
        variables: {
          id: "",
          sourceId: "",
          targetEnId: entityContext.en_id,
          type: "dq",
        },
      });
    } else {
      // Reset state when closing
      setRuleName("");
      setRuleExpression("");
      setRuleType("check");
      setLocalRules([]);
      setExistingRules([]);
      setEditingRuleIndex(null);
    }
  }, [open, entityContext.en_id, fetchRulesets]);

  const handleAddRule = () => {
    if (!ruleName.trim() || !ruleExpression.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and Rule are required",
        variant: "destructive",
      });
      return;
    }

    const newRule: LocalRule = {
      name: ruleName,
      rule_expression: ruleExpression,
      subtype: ruleType,
      enabled: true,
    };

    if (editingRuleIndex !== null) {
      // Update existing rule
      const updated = [...localRules];
      updated[editingRuleIndex] = newRule;
      setLocalRules(updated);
      setEditingRuleIndex(null);
    } else {
      // Add new rule
      setLocalRules([...localRules, newRule]);
    }

    // Reset form
    setRuleName("");
    setRuleExpression("");
    setRuleType("check");
  };

  const handleEditLocalRule = (index: number) => {
    const rule = localRules[index];
    setRuleName(rule.name);
    setRuleExpression(rule.rule_expression);
    setRuleType(rule.subtype);
    setEditingRuleIndex(index);
  };

  const handleDeleteLocalRule = (index: number) => {
    setLocalRules(localRules.filter((_, i) => i !== index));
    if (editingRuleIndex === index) {
      setEditingRuleIndex(null);
      setRuleName("");
      setRuleExpression("");
      setRuleType("check");
    }
  };

  const handleToggleEnabled = (index: number) => {
    const updated = [...localRules];
    updated[index].enabled = !updated[index].enabled;
    setLocalRules(updated);
  };

  const handleDeleteExistingRule = async (ruleId: string) => {
    try {
      const response = await fetch(`${API_CONFIG.REST_ENDPOINT}/api/v1/rule`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: [ruleId] }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete rule");
      }

      toast({
        title: "Success",
        description: "Rule deleted successfully",
      });

      // Refresh the rules list
      fetchRulesets({
        variables: {
          id: "",
          sourceId: "",
          targetEnId: entityContext.en_id,
          type: "dq",
        },
      });
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast({
        title: "Error",
        description: "Failed to delete rule",
        variant: "destructive",
      });
    }
  };

  const handleApplyRules = async () => {
    if (localRules.length === 0) {
      toast({
        title: "No Rules",
        description: "Please add at least one rule before applying",
        variant: "destructive",
      });
      return;
    }

    setIsApplying(true);

    try {
      const ruleRequests = [
        ...existingRules.map((rule) => ({
          id: rule.id,
          type: rule.type,
          subtype: rule.subtype,
          name: rule.name,
          alias: rule.alias || rule.name,
          rule_expression: rule.rule_expression,
          rule_status: rule.rule_status,
          description: rule.description || rule.name,
          is_shared: rule.is_shared,
          language: rule.language,
          meta_id: rule.meta_id,
          meta: rule.meta,
        })),
        ...localRules.map((rule) => ({
          type: "dq",
          subtype: rule.subtype,
          name: rule.name,
          description: rule.name,
          rule_status: rule.enabled ? "active" : "inactive",
          rule_expression: rule.rule_expression,
          meta: columnName,
          language: "sql",
        })),
      ];

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
          name: `${entityContext.ns}_${entityContext.sa}_${entityContext.en}_dq`,
          description: `${entityContext.ns}_${entityContext.sa}_${entityContext.en}_dq`,
          type: "dq",
          rule_requests: ruleRequests,
        },
      };

      const response = await fetch(`${API_CONFIG.REST_ENDPOINT}/api/v1/ruleset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to apply rules");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: `Rules applied successfully`,
      });

      // Clear local rules and refresh existing rules
      setLocalRules([]);
      fetchRulesets({
        variables: {
          id: "",
          sourceId: "",
          targetEnId: entityContext.en_id,
          type: "dq",
        },
      });
    } catch (error) {
      console.error("Error applying rules:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply rules",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">
            Rule Editor | <span className="text-primary">{columnName}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Add Rule Form */}
          <div className="space-y-4 border rounded-lg p-4 bg-card">
            <div className="space-y-2">
              <Label htmlFor="rule-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rule-name"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="Enter rule name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-expression">
                Rule <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rule-expression"
                value={ruleExpression}
                onChange={(e) => setRuleExpression(e.target.value)}
                placeholder="Enter rule expression (e.g., len(column_name) > 0)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-type">
                Type <span className="text-destructive">*</span>
              </Label>
              <Select value={ruleType} onValueChange={(val) => setRuleType(val as "check" | "action")}>
                <SelectTrigger id="rule-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleAddRule} className="flex-1">
                {editingRuleIndex !== null ? "Update Rule" : "Add Rule"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRuleName("");
                  setRuleExpression("");
                  setRuleType("check");
                  setEditingRuleIndex(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* Rules Lists */}
          <Tabs defaultValue="check" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="check">Check Rules</TabsTrigger>
              <TabsTrigger value="action">Action Rules</TabsTrigger>
            </TabsList>

            <TabsContent value="check" className="space-y-4 mt-4">
              <h3 className="font-semibold text-lg">Check Rules List</h3>
              
              {localRules.filter((r) => r.subtype === "check").length === 0 ? (
                <p className="text-sm text-muted-foreground">No check rules added yet</p>
              ) : (
                <div className="space-y-2">
                  {localRules
                    .map((rule, index) => ({ rule, originalIndex: index }))
                    .filter(({ rule }) => rule.subtype === "check")
                    .map(({ rule, originalIndex }) => (
                      <div
                        key={originalIndex}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{rule.rule_expression}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => handleToggleEnabled(originalIndex)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditLocalRule(originalIndex)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLocalRule(originalIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="action" className="space-y-4 mt-4">
              <h3 className="font-semibold text-lg">Action Rules List</h3>
              
              {localRules.filter((r) => r.subtype === "action").length === 0 ? (
                <p className="text-sm text-muted-foreground">No action rules added yet</p>
              ) : (
                <div className="space-y-2">
                  {localRules
                    .map((rule, index) => ({ rule, originalIndex: index }))
                    .filter(({ rule }) => rule.subtype === "action")
                    .map(({ rule, originalIndex }) => (
                      <div
                        key={originalIndex}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{rule.rule_expression}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => handleToggleEnabled(originalIndex)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditLocalRule(originalIndex)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLocalRule(originalIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Existing Rules */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-semibold text-lg">Existing Rules for {columnName}</h3>
            {loadingRulesets ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : existingRules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No existing rules found</p>
            ) : (
              <div className="space-y-2">
                {existingRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{rule.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{rule.rule_expression}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Type: {rule.subtype} | Status: {rule.rule_status}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => rule.id && handleDeleteExistingRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Apply Rules Button */}
          <Button
            onClick={handleApplyRules}
            disabled={isApplying || localRules.length === 0}
            className="w-full"
            size="lg"
          >
            {isApplying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying Rules...
              </>
            ) : (
              "Apply Rules"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
