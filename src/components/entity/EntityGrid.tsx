import { useMemo } from "react";
import { useQuery } from "@apollo/client/react/hooks";
import { Database } from "lucide-react";
import { GET_ENTITIES, type GetEntitiesResponse } from "@/graphql/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EntityGridProps {
  subjectAreaId?: string;
  namespaceType: string;
  searchQuery: string;
  onEntityClick: (entity: any) => void;
}

export function EntityGrid({ subjectAreaId, namespaceType, searchQuery, onEntityClick }: EntityGridProps) {
  const { data, loading, error } = useQuery<GetEntitiesResponse>(GET_ENTITIES);

  const filteredEntities = useMemo(() => {
    if (!data?.meta_entity) return [];

    let entities = data.meta_entity.filter(
      entity => entity.subjectarea?.namespace?.type?.toLowerCase() === namespaceType.toLowerCase()
    );

    if (subjectAreaId) {
      entities = entities.filter(entity => entity.sa_id === subjectAreaId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      entities = entities.filter(entity =>
        entity.name.toLowerCase().includes(query) ||
        entity.description?.toLowerCase().includes(query) ||
        entity.subjectarea?.name?.toLowerCase().includes(query)
      );
    }

    return entities;
  }, [data, subjectAreaId, namespaceType, searchQuery]);

  if (loading) {
    return (
      <div className="flex-center py-12">
        <div className="text-muted">Loading entities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-center py-12">
        <div className="text-destructive">Error loading entities: {error.message}</div>
      </div>
    );
  }

  if (filteredEntities.length === 0) {
    return (
      <div className="flex-center py-12">
        <div className="text-center stack-sm">
          <Database className="icon-xl mx-auto icon-muted opacity-50" />
          <p className="text-muted">No entities found</p>
          {searchQuery && <p className="text-sm text-muted">Try adjusting your search</p>}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .entity-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .entity-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .entity-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (min-width: 1280px) {
          .entity-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        .entity-card {
          cursor: pointer;
          transition: box-shadow 0.2s;
        }

        .entity-card:hover {
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }
      `}</style>

      <div className="entity-grid">
        {filteredEntities.map((entity) => (
          <Card
            key={entity.id}
            className="entity-card"
            onClick={() => onEntityClick(entity)}
          >
            <CardContent className="card-padding">
              <div className="flex-between mb-3">
                <Database className="icon-lg icon-primary" />
                <Badge variant={entity.is_delta ? "default" : "secondary"} className="text-xs">
                  {entity.type}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <Badge variant="entity" className="text-[10px] px-1.5 py-0 shrink-0">EN</Badge>
                <h3 className="font-semibold text-sm truncate" title={entity.name}>{entity.name}</h3>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <Badge variant="namespace" className="text-[10px] px-1.5 py-0 shrink-0">NS</Badge>
                <p className="text-xs text-muted truncate" title={entity.subjectarea?.namespace?.name}>{entity.subjectarea?.namespace?.name}</p>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <Badge variant="subjectarea" className="text-[10px] px-1.5 py-0 shrink-0">SA</Badge>
                <p className="text-xs text-muted truncate" title={entity.subjectarea?.name}>{entity.subjectarea?.name}</p>
              </div>
              {entity.description && (
                <p className="text-xs text-muted line-clamp-2" title={entity.description}>
                  {entity.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}