import { useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GlossaryEntityDropdown } from "@/components/glossary/GlossaryEntityDropdown";
import { type Entity } from "@/graphql/queries/entity";
import {
  GET_META_CONCEPTUAL,
  GET_CONCEPTUAL_MODEL,
  type MetaConceptualField,
  type ConceptualModel,
  type ConceptualModelMeta,
} from "@/graphql/queries/conceptualmodel";
import { API_CONFIG } from "@/config/api";

export default function BuildModels() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [projectCode, setProjectCode] = useState("model");
  const [metaFields, setMetaFields] = useState<MetaConceptualField[]>([]);
  const [selectedMetas, setSelectedMetas] = useState<Set<string>>(new Set<string>());
  const [existingModel, setExistingModel] = useState<ConceptualModel | null>(null);
  const [loading, setLoading] = useState(false);

  const [fetchMeta, { loading: metaLoading }] = useLazyQuery(GET_META_CONCEPTUAL, {
    onCompleted: (data) => {
      if (data?.meta_meta) {
        setMetaFields(data.meta_meta);
        setSelectedMetas(new Set<string>());
      }
    },
    onError: (error) => {
      console.error("Error fetching meta:", error);
      toast({
        title: "Error",
        description: "Failed to fetch entity metadata",
        variant: "destructive",
      });
    },
  });

  const [fetchConceptualModel] = useLazyQuery(GET_CONCEPTUAL_MODEL, {
    onCompleted: (data) => {
      if (data?.conceptual_model && data.conceptual_model.length > 0) {
        const model = data.conceptual_model[0];
        setExistingModel(model);
        
        // Pre-select metas that are already in the model
        const selectedNames = new Set<string>(
          model.selected_metas.map((m: ConceptualModelMeta) => m.name)
        );
        setSelectedMetas(selectedNames);
      } else {
        setExistingModel(null);
      }
    },
  });

  const handleEntitySelect = (entity: Entity) => {
    setSelectedEntity(entity);
    setMetaFields([]);
    setSelectedMetas(new Set<string>());
    setExistingModel(null);

    // Fetch meta fields for the selected entity
    fetchMeta({ variables: { entity: entity.id } });

    // Check if there's an existing conceptual model for this entity
    fetchConceptualModel({ variables: { glossaryEntityId: entity.id } });
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

  const handlePublishModel = async () => {
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
      const payload = {
        ns: selectedEntity.subjectarea.namespace.name,
        sa: selectedEntity.subjectarea.name,
        en: selectedEntity.name,
        ns_type: "staging",
        ns_id: selectedEntity.subjectarea.namespace.id,
        sa_id: selectedEntity.sa_id,
        en_id: selectedEntity.id,
      };

      const response = await fetch(
        `${API_CONFIG.REST_ENDPOINT}/mwn/load_conceptual_model?project_code=${projectCode}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: "Model published successfully",
      });

      // Refresh the existing model data
      fetchConceptualModel({ variables: { glossaryEntityId: selectedEntity.id } });
    } catch (error) {
      console.error("Error publishing model:", error);
      toast({
        title: "Error",
        description: "Failed to publish model. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
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
            <Button onClick={handlePublishModel} disabled={!selectedEntity || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish Model"
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate("/model")}>
              Cancel
            </Button>
          </div>
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
                          <span className="font-semibold text-primary">{source.subjectarea.namespace.name}</span>
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
