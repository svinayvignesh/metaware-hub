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
import { Badge } from "@/components/ui/badge";
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

export function RuleEditor({ open, onClose, columnName, entityContext }: RuleEditorProps) {
  const [ruleName, setRuleName] = useState("");
  const [ruleExpression, setRuleExpression] = useState("");
  const [ruleType, setRuleType] = useState<"check" | "action">("check");
  const [existingRules, setExistingRules] = useState<Rule[]>([]);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const [fetchRulesets, { loading: loadingRulesets, data: rulesetsData, error: rulesetsError }] = useLazyQuery(GET_META_RULESETS, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (!rulesetsData) return;
    console.log("Rulesets query response:", rulesetsData);
    if (rulesetsData.meta_ruleset && rulesetsData.meta_ruleset.length > 0) {
      const allRules = rulesetsData.meta_ruleset.flatMap((rs: Ruleset) => rs.rules || []);
      const columnRules = allRules.filter((rule: Rule) => rule.meta?.alias === columnName || rule.meta?.name === columnName);
      setExistingRules(columnRules);
    } else {
      setExistingRules([]);
    }
  }, [rulesetsData, columnName]);

  useEffect(() => {
    if (!rulesetsError) return;
    console.error("Error fetching rulesets:", rulesetsError);
    toast({
      title: "Error",
      description: "Failed to fetch existing rules",
      variant: "destructive",
    });
  }, [rulesetsError]);

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
      setExistingRules([]);
      setEditingRule(null);
    }
  }, [open, entityContext.en_id, fetchRulesets]);

  const handleApplyRule = async () => {
    if (!ruleName.trim() || !ruleExpression.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and Rule are required",
        variant: "destructive",
      });
      return;
    }

    setIsApplying(true);

    // Optimistically update the UI BEFORE making the API call
    let previousRules = [...existingRules];
    if (editingRule) {
      // Update existing rule in the list
      setExistingRules(prevRules =>
        prevRules.map(rule =>
          rule.id === editingRule.id
            ? { ...rule, name: ruleName, rule_expression: ruleExpression, subtype: ruleType }
            : rule
        )
      );
    } else {
      // Add new rule to the list (create a temporary rule object)
      const tempRule: Rule = {
        id: `temp_${Date.now()}`, // Temporary ID
        name: ruleName,
        rule_expression: ruleExpression,
        subtype: ruleType,
        type: "dq",
        rule_status: "active",
        language: "sql",
        description: ruleName,
        alias: ruleName,
        is_shared: null,
        meta_id: null,
        meta: { name: columnName, alias: columnName, id: "" },
      };
      setExistingRules(prevRules => [...prevRules, tempRule]);
    }

    try {
      const ruleRequests = [
        ...existingRules
          .filter((rule) => editingRule ? rule.id !== editingRule.id : true)
          .map((rule) => ({
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
            meta: rule.meta?.alias || rule.meta?.name,
          })),
        {
          ...(editingRule?.id && { id: editingRule.id }),
          type: "dq",
          subtype: ruleType,
          name: ruleName,
          description: ruleName,
          rule_status: "active",
          rule_expression: ruleExpression,
          meta: columnName,
          language: "sql",
        },
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

      const response = await fetch(`${API_CONFIG.REST_ENDPOINT}/mwn/create_ruleset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("create_ruleset API response:", result);

      // Check if response indicates success by checking the response body
      // The API may return 400 status but still have success in the body
      const isSuccess = result.status === "success" || result.status_code === 201;

      if (isSuccess) {
        toast({
          title: "Success",
          description: editingRule ? "Rule updated successfully" : "Rule applied successfully",
        });

        // Reset form
        setRuleName("");
        setRuleExpression("");
        setRuleType("check");
        setEditingRule(null);

        // Refresh existing rules from server to get the real IDs and sync
        fetchRulesets({
          variables: {
            id: "",
            sourceId: "",
            targetEnId: entityContext.en_id,
            type: "dq",
          },
        });
      } else {
        // Restore previous state on error
        setExistingRules(previousRules);

        throw new Error(result.message || `Failed to apply rule: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error applying rule:", error);

      // Restore previous state on error
      setExistingRules(previousRules);

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply rule",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleEditExistingRule = (rule: Rule) => {
    console.log("Editing rule:", rule);
    setEditingRule(rule);
    setRuleName(rule.name);
    setRuleExpression(rule.rule_expression);
    setRuleType(rule.subtype as "check" | "action");

    // Scroll to top of sheet to show the form
    setTimeout(() => {
      const sheetContent = document.querySelector('[role="dialog"]');
      if (sheetContent) {
        sheetContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingRule(null);
    setRuleName("");
    setRuleExpression("");
    setRuleType("check");
  };

  const handleDeleteExistingRule = async (ruleId: string) => {
    // Optimistically remove from UI immediately
    setExistingRules(prevRules => prevRules.filter(rule => rule.id !== ruleId));

    try {
      const response = await fetch(`${API_CONFIG.REST_ENDPOINT}/mwn/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ object_type: "rule", ids: [ruleId] }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete rule");
      }

      toast({
        title: "Success",
        description: "Rule deleted successfully",
      });

      // Refresh the rules list to ensure sync with server
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

      // Restore the rule if deletion failed
      fetchRulesets({
        variables: {
          id: "",
          sourceId: "",
          targetEnId: entityContext.en_id,
          type: "dq",
        },
      });

      toast({
        title: "Error",
        description: "Failed to delete rule",
        variant: "destructive",
      });
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
          {/* Apply Rule Form */}
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
              <Button onClick={handleApplyRule} disabled={isApplying} className="flex-1">
                {isApplying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingRule ? "Updating..." : "Applying..."}
                  </>
                ) : (
                  editingRule ? "Update Rule" : "Apply Rule"
                )}
              </Button>
              {editingRule && (
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex-1"
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </div>

          {/* Existing Rules */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Rules for {columnName}</h3>
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
                    className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${editingRule?.id === rule.id ? "bg-primary/10 border-primary" : "bg-card"
                      }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{rule.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {rule.subtype}
                        </Badge>
                        <Badge
                          variant={rule.rule_status === "active" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {rule.rule_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{rule.rule_expression}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditExistingRule(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => rule.id && handleDeleteExistingRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
