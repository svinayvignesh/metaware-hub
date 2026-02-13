import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Link2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { entityRelationAPI } from "@/services/api";
import { GET_ENTITIES, type GetEntitiesResponse } from "@/graphql/queries";
import {
  GET_ENTITY_RELATIONS_BY_RELATED,
  type GetEntityRelationsByRelatedResponse,
  type GetEntityRelationsByRelatedVariables,
} from "@/graphql/queries/entityrelation";

interface GlossaryLinkPanelProps {
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

export const GlossaryLinkPanel: React.FC<GlossaryLinkPanelProps> = ({
  entityContext,
  onBack,
}) => {
  const { toast } = useToast();
  const [selectedGlossaryId, setSelectedGlossaryId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch existing relations for this staging entity
  const {
    data: relationsData,
    loading: relationsLoading,
    refetch: refetchRelations,
  } = useQuery<GetEntityRelationsByRelatedResponse, GetEntityRelationsByRelatedVariables>(
    GET_ENTITY_RELATIONS_BY_RELATED,
    {
      variables: { relatedEnId: entityContext.en_id, relationType: "GLOSSARY-SOURCE" },
      fetchPolicy: "network-only",
    }
  );

  // Fetch all entities to get glossary entities for the dropdown
  const { data: entitiesData } = useQuery<GetEntitiesResponse>(GET_ENTITIES);

  const glossaryEntities = entitiesData?.meta_entity.filter(
    (entity) => entity.subjectarea?.namespace?.type === "glossary"
  ) || [];

  const existingRelations = relationsData?.entity_relation || [];

  // Filter out already-linked glossary entities from the dropdown
  const linkedTargetIds = new Set(existingRelations.map((r) => r.target_en_id));
  const availableGlossaryEntities = glossaryEntities.filter(
    (e) => !linkedTargetIds.has(e.id)
  );

  const handleAdd = async () => {
    if (!selectedGlossaryId) return;

    setSaving(true);
    try {
      await entityRelationAPI.create({
        target_en_id: selectedGlossaryId,
        related_en_id: entityContext.en_id,
        relation_type: "GLOSSARY-SOURCE",
      });
      toast({ title: "Glossary link created" });
      setSelectedGlossaryId("");
      await refetchRelations();
    } catch (err: any) {
      toast({ title: "Failed to create link", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (relationId: string) => {
    setDeletingId(relationId);
    try {
      await entityRelationAPI.delete(relationId);
      toast({ title: "Glossary link removed" });
      await refetchRelations();
    } catch (err: any) {
      toast({ title: "Failed to remove link", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Add new link */}
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Link to Glossary Entity</h3>
        <div className="flex gap-2">
          <Select value={selectedGlossaryId} onValueChange={setSelectedGlossaryId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a glossary entity..." />
            </SelectTrigger>
            <SelectContent>
              {availableGlossaryEntities.map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.subjectarea?.namespace?.name}.{entity.subjectarea?.name}.{entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={!selectedGlossaryId || saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </Card>

      {/* Existing links */}
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">
          Linked Glossary Entities ({existingRelations.length})
        </h3>
        {relationsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : existingRelations.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No glossary entities linked yet. Use the dropdown above to add one.
          </p>
        ) : (
          <div className="space-y-2">
            {existingRelations.map((relation) => {
              const targetEntity = relation.target_entity?.[0];
              const displayName = targetEntity
                ? `${targetEntity.subjectarea?.namespace?.name}.${targetEntity.subjectarea?.name}.${targetEntity.name}`
                : relation.target_en_id;

              return (
                <div
                  key={relation.id}
                  className="flex items-center justify-between p-2 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{displayName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(relation.id)}
                    disabled={deletingId === relation.id}
                    className="text-destructive hover:text-destructive"
                  >
                    {deletingId === relation.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
