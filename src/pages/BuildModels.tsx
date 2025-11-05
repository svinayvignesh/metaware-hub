import { useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { GlossaryEntityDropdown } from "@/components/glossary/GlossaryEntityDropdown";
import { type Entity } from "@/graphql/queries/entity";
import {
  GET_CONCEPTUAL_MODEL,
  type ConceptualModel,
  type ConceptualModelMeta,
} from "@/graphql/queries/conceptualmodel";
import {
  GET_META_FOR_ENTITY,
  type MetaField,
} from "@/graphql/queries/meta";
import {
  GET_RULESETS_BY_ENTITY,
  type RulesetWithSource,
  type GetRulesetsByEntityResponse,
} from "@/graphql/queries/ruleset";
import { API_CONFIG } from "@/config/api";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { useEffect } from "react";

export default function BuildModels() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [projectCode, setProjectCode] = useState("model");
  const [metaFields, setMetaFields] = useState<MetaField[]>([]);
  const [selectedMetas, setSelectedMetas] = useState<Set<string>>(new Set<string>());
  const [existingModel, setExistingModel] = useState<ConceptualModel | null>(null);
  const [rulesets, setRulesets] = useState<RulesetWithSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [step1Response, setStep1Response] = useState<any>(null);
  const [step2Response, setStep2Response] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("step1");

  const [fetchMeta, { loading: metaLoading, data: metaData }] = useLazyQuery(GET_META_FOR_ENTITY);

  useEffect(() => {
    if (metaData?.meta_meta) {
      setMetaFields(metaData.meta_meta);
      setSelectedMetas(new Set<string>());
    }
  }, [metaData]);

  const [fetchConceptualModel, { data: conceptualModelData }] = useLazyQuery(GET_CONCEPTUAL_MODEL);

  useEffect(() => {
    if (conceptualModelData?.conceptual_model && conceptualModelData.conceptual_model.length > 0) {
      const model = conceptualModelData.conceptual_model[0];
      setExistingModel(model);
      
      // Pre-select metas that are already in the model
      const selectedNames = new Set<string>(
        model.selected_metas.map((m: ConceptualModelMeta) => m.name)
      );
      setSelectedMetas(selectedNames);
    } else if (conceptualModelData?.conceptual_model) {
      setExistingModel(null);
    }
  }, [conceptualModelData]);

  const [fetchRulesets, { data: rulesetsData }] = useLazyQuery<GetRulesetsByEntityResponse>(
    GET_RULESETS_BY_ENTITY
  );

  useEffect(() => {
    if (rulesetsData?.meta_ruleset) {
      setRulesets(rulesetsData.meta_ruleset);
    }
  }, [rulesetsData]);

  const handleEntitySelect = (entity: Entity) => {
    setSelectedEntity(entity);
    setMetaFields([]);
    setSelectedMetas(new Set<string>());
    setExistingModel(null);
    setRulesets([]);

    // Fetch meta fields for the selected entity
    fetchMeta({ variables: { enid: entity.id } });

    // Check if there's an existing conceptual model for this entity
    fetchConceptualModel({ variables: { glossaryEntityId: entity.id } });

    // Fetch rulesets for source expressions
    fetchRulesets({
      variables: {
        targetEnId: entity.id,
        type: "glossary_association",
      },
    });
  };

  const handleMetaToggle = (alias: string) => {
    setSelectedMetas((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(alias)) {
        newSet.delete(alias);
      } else {
        newSet.add(alias);
      }
      return newSet;
    });
  };

  const handleBuildGlossaryPublish = async () => {
    if (!selectedEntity) {
      toast({
        title: "Validation Error",
        description: "Please select a glossary entity",
        variant: "destructive",
      });
      return;
    }

    if (selectedMetas.size === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one metadata attribute",
        variant: "destructive",
      });
      return;
    }

    if (rulesets.length === 0) {
      toast({
        title: "Validation Error",
        description: "No source associations found. Please create mappings in the Glossary first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get the first source entity from rulesets (or you could let user select)
      const firstRuleset = rulesets[0];
      const sourceEntity = firstRuleset.source?.source_entity;

      if (!sourceEntity) {
        throw new Error("Source entity information not found in rulesets");
      }

      // Build a map of meta name to source expression from rulesets
      const sourceExpressionMap = new Map<string, string>();
      rulesets.forEach(ruleset => {
        ruleset.rules.forEach(rule => {
          if (rule.meta?.name) {
            sourceExpressionMap.set(rule.meta.name, rule.rule_expression);
          }
        });
      });

      const publishColumns = Array.from(selectedMetas).map(metaName => {
        const metaField = metaFields.find(f => f.alias === metaName);
        return {
          target: metaName,
          glossary: metaName,
          description: metaField?.description || ""
        };
      });

      const ruleRequests = Array.from(selectedMetas).map(metaName => {
        const sourceExpression = sourceExpressionMap.get(metaName) || metaName;
        return {
          meta: metaName,
          rule_expression: sourceExpression,
          name: `${metaName}_rule`,
          description: `${metaName}_rule`,
          language: "sql",
          rule_status: "active",
          subtype: ".",
          type: "model"
        };
      });

      const payload = {
        publish_config_request: {
          glossary_entity_fqn: `${selectedEntity.subjectarea?.namespace?.name}.${selectedEntity.subjectarea?.name}.${selectedEntity.name}`,
          target_runtime: "duckdb",
          target_profile: projectCode,
          target_namespace: `${selectedEntity.subjectarea?.namespace?.name}_publish`,
          target_schema: selectedEntity.subjectarea?.name,
          target_name: selectedEntity.name,
          target_fqn: `${selectedEntity.subjectarea?.namespace?.name}_publish.${selectedEntity.subjectarea?.name}.${selectedEntity.name}`,
          materialize_as: "table",
          status: "draft",
          version: 1
        },
        publish_columns: publishColumns,
        entity_core: {
          ns: `${selectedEntity.subjectarea?.namespace?.name}_publish`,
          sa: selectedEntity.subjectarea?.name,
          en: selectedEntity.name,
          ns_type: "model"
        },
        source_request: {
          type: "DIRECT",
          source_ns: sourceEntity.subjectarea?.namespace?.name,
          source_sa: sourceEntity.subjectarea?.name,
          source_en: sourceEntity.name
        },
        ruleset_request: {
          name: `${selectedEntity.name}_publish_ruleset`,
          type: "glossary_publish",
          description: `Column selection and transforms for ${selectedEntity.name} publishing`,
          rule_requests: ruleRequests
        }
      };

      const response = await fetch(
        `${API_CONFIG.REST_ENDPOINT}/mwn/build_glossary_publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Build glossary publish failed with status: ${response.status}`);
      }

      const result = await response.json();
      setStep1Response(result);

      toast({
        title: "Success",
        description: "Glossary publish artifacts built successfully",
      });

      // Refresh the existing model data
      fetchConceptualModel({ variables: { glossaryEntityId: selectedEntity.id } });
    } catch (error) {
      console.error("Error building glossary publish:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to build glossary publish. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadGlossaryPublish = async () => {
    if (!selectedEntity) {
      toast({
        title: "Validation Error",
        description: "Please select a glossary entity",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const targetEntityCore = {
        ns: `${selectedEntity.subjectarea?.namespace?.name}_publish`,
        sa: selectedEntity.subjectarea?.name,
        en: selectedEntity.name,
        ns_type: "model",
        ns_id: selectedEntity.subjectarea?.namespace?.id,
        sa_id: selectedEntity.sa_id,
        en_id: selectedEntity.id,
      };

      const payload = {
        target_en_core: targetEntityCore,
        loader_cfg: {}
      };

      const response = await fetch(
        `${API_CONFIG.REST_ENDPOINT}/mwn/load_glossary_publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Load glossary publish failed with status: ${response.status}`);
      }

      const result = await response.json();
      setStep2Response(result);

      toast({
        title: "Success",
        description: `Data loaded successfully. Rows: ${result.rows || 0}`,
      });
    } catch (error) {
      console.error("Error loading glossary publish:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load glossary publish. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/model">Data Model</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Build Models</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/model")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Build Models</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Business Glossary (Blueprint)</Label>
              <GlossaryEntityDropdown
                value={selectedEntity?.id}
                onSelect={handleEntitySelect}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectCode">Project Code</Label>
              <Input
                id="projectCode"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                placeholder="Enter project code"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="step1">Step 1: Build Artifacts</TabsTrigger>
              <TabsTrigger value="step2">Step 2: Load Data</TabsTrigger>
            </TabsList>

            <TabsContent value="step1" className="space-y-6">
              {metaLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : metaFields.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Select</th>
                        <th className="text-left p-4 font-medium">Attribute</th>
                        <th className="text-left p-4 font-medium">Type</th>
                        <th className="text-left p-4 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metaFields.map((field) => (
                        <tr key={field.id} className="border-t hover:bg-muted/30">
                          <td className="p-4">
                            <Checkbox
                              checked={selectedMetas.has(field.alias)}
                              onCheckedChange={() => handleMetaToggle(field.alias)}
                            />
                          </td>
                          <td className="p-4">{field.name}</td>
                          <td className="p-4 font-mono text-sm">{field.alias}</td>
                          <td className="p-4 text-muted-foreground">
                            {field.description || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Select a glossary entity to view attributes
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleBuildGlossaryPublish} disabled={!selectedEntity || loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Building...
                    </>
                  ) : (
                    "Build Artifacts"
                  )}
                </Button>
                <Button variant="outline" onClick={() => navigate("/model")}>
                  Cancel
                </Button>
              </div>

              {step1Response && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Build Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                      {JSON.stringify(step1Response, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="step2" className="space-y-6">
              <div className="flex gap-3">
                <Button onClick={handleLoadGlossaryPublish} disabled={!selectedEntity || loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load Data"
                  )}
                </Button>
              </div>

              {step2Response && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Load Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm">
                        <span className="font-medium">Rows Loaded:</span> {step2Response.rows || 0}
                      </div>
                      {step2Response.data && Array.isArray(step2Response.data) && step2Response.data.length > 0 && (
                        <div className="border rounded-lg overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {Object.keys(step2Response.data[0]).map((key) => (
                                  <TableHead key={key}>{key}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {step2Response.data.map((row: any, idx: number) => (
                                <TableRow key={idx}>
                                  {Object.values(row).map((value: any, cellIdx: number) => (
                                    <TableCell key={cellIdx}>
                                      {value !== null && value !== undefined ? String(value) : "-"}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Existing Models</CardTitle>
            </CardHeader>
            <CardContent>
              {existingModel ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-sm mt-0.5">1.</span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-sm flex-wrap">
                        <span className="font-semibold text-primary">{existingModel.glossaryEntityFqn.split('.')[0]}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="font-medium">{existingModel.glossaryEntityFqn.split('.')[1]}</span>
                        <span className="text-muted-foreground">/</span>
                        <span>{existingModel.glossaryEntityFqn.split('.')[2]}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {existingModel.id}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No existing models found
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connected Sources</CardTitle>
            </CardHeader>
            <CardContent>
              {existingModel?.associated_source_entities &&
              existingModel.associated_source_entities.length > 0 ? (
                <div className="space-y-3">
                  {existingModel.associated_source_entities.map((source, idx) => (
                    <div key={source.id} className="flex items-start gap-2">
                      <span className="font-medium text-sm mt-0.5">{idx + 1}.</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-sm flex-wrap">
                          <span className="font-semibold text-primary">{source.subjectarea?.namespace?.name}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="font-medium">{source.subjectarea.name}</span>
                          <span className="text-muted-foreground">/</span>
                          <span>{source.name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No connected sources found
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
