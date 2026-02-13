import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Entity } from "@/graphql/queries/entity";
import {
  GET_ENTITY_RELATIONS,
  type GetEntityRelationsResponse,
  type GetEntityRelationsVariables,
} from "@/graphql/queries/entityrelation";

interface SourceAssociationSelectProps {
  glossaryEntity: Entity;
  value?: string;
  onSelect: (entity: Entity) => void;
}

export function SourceAssociationSelect({
  glossaryEntity,
  value,
  onSelect,
}: SourceAssociationSelectProps) {
  const { data, loading } = useQuery<GetEntityRelationsResponse, GetEntityRelationsVariables>(
    GET_ENTITY_RELATIONS,
    {
      variables: { targetEnId: glossaryEntity.id },
      skip: !glossaryEntity?.id,
    }
  );

  const sourceAssociations = useMemo(() => {
    if (!data?.entity_relation) return [];

    // Each relation has related_entity (the staging entities linked to this glossary entity)
    return data.entity_relation
      .filter((rel) => rel.relation_type === "GLOSSARY-SOURCE")
      .flatMap((rel) => rel.related_entity || [])
      .filter((entity) => entity && entity.id);
  }, [data]);

  if (loading) {
    return (
      <div className="flex-start gap-sm text-sm text-muted-foreground">
        <Loader2 className="icon-sm animate-spin" />
        Loading associations...
      </div>
    );
  }

  if (sourceAssociations.length === 0) {
    return (
      <div className="text-muted">
        No source associations found for this entity
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Source Entity Association</label>
      <Select
        value={value}
        onValueChange={(val) => {
          const selected = sourceAssociations.find((e) => e.id === val);
          if (selected) onSelect(selected as Entity);
        }}
      >
        <SelectTrigger className="w-full rounded-xl">
          <SelectValue placeholder="Select a source entity to map from..." />
        </SelectTrigger>
        <SelectContent>
          {sourceAssociations.map((entity) => (
            <SelectItem key={entity.id} value={entity.id}>
              <span className="font-medium">
                {entity.subjectarea?.namespace?.name}
              </span>
              <span className="text-muted-foreground mx-1.5">/</span>
              <span className="font-medium">{entity.subjectarea?.name}</span>
              <span className="text-muted-foreground mx-1.5">/</span>
              <span>{entity.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
