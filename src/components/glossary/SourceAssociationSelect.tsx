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
import { GET_ENTITIES, type Entity } from "@/graphql/queries/entity";

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
  const { data, loading } = useQuery(GET_ENTITIES);

  const sourceAssociations = useMemo(() => {
    if (!data?.meta_entity || !glossaryEntity) return [];

    const glossaryEntityName = glossaryEntity.name;
    if (!glossaryEntityName) return [];

    return data.meta_entity.filter(
      (entity: Entity) =>
        entity.subjectarea.namespace.type === "staging" &&
        entity.primary_grain === glossaryEntityName
    );
  }, [data, glossaryEntity]);

  if (loading) {
    return (
      <>
        <style>{`
          .source-loading {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: hsl(var(--muted-foreground));
          }

          .source-loading-icon {
            height: 1rem;
            width: 1rem;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        <div className="source-loading">
          <Loader2 className="source-loading-icon" />
          Loading associations...
        </div>
      </>
    );
  }

  if (sourceAssociations.length === 0) {
    return (
      <>
        <style>{`
          .source-empty {
            font-size: 0.875rem;
            color: hsl(var(--muted-foreground));
          }
        `}</style>

        <div className="source-empty">
          No source associations found for this entity
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .source-select-label {
          font-weight: 500;
        }

        .source-select-separator {
          color: hsl(var(--muted-foreground));
          margin-left: 0.375rem;
          margin-right: 0.375rem;
        }
      `}</style>

      <Select
        value={value}
        onValueChange={(val) => {
          const selected = sourceAssociations.find((e) => e.id === val);
          if (selected) onSelect(selected);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Association" />
        </SelectTrigger>
        <SelectContent>
          {sourceAssociations.map((entity) => (
            <SelectItem key={entity.id} value={entity.id}>
              <span className="source-select-label">
                {entity.subjectarea.namespace.name}
              </span>
              <span className="source-select-separator">/</span>
              <span className="source-select-label">{entity.subjectarea.name}</span>
              <span className="source-select-separator">/</span>
              <span>{entity.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}