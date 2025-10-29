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
      entity => entity.subjectarea.namespace.type.toLowerCase() === namespaceType.toLowerCase()
    );

    if (subjectAreaId) {
      entities = entities.filter(entity => entity.sa_id === subjectAreaId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      entities = entities.filter(entity =>
        entity.name.toLowerCase().includes(query) ||
        entity.description?.toLowerCase().includes(query) ||
        entity.subjectarea.name.toLowerCase().includes(query)
      );
    }

    return entities;
  }, [data, subjectAreaId, namespaceType, searchQuery]);

  if (loading) {
    return (
      <div className="entity-loading-container">
        <div className="entity-loading-text">Loading entities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="entity-error-container">
        <div className="entity-error-text">Error loading entities: {error.message}</div>
      </div>
    );
  }

  if (filteredEntities.length === 0) {
    return (
      <div className="entity-empty-container">
        <div className="entity-empty-content">
          <Database className="entity-empty-icon" />
          <p>No entities found</p>
          {searchQuery && <p className="entity-empty-hint">Try adjusting your search</p>}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .entity-loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding-top: 3rem;
          padding-bottom: 3rem;
        }

        .entity-loading-text {
          color: hsl(var(--muted-foreground));
        }

        .entity-error-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding-top: 3rem;
          padding-bottom: 3rem;
        }

        .entity-error-text {
          color: hsl(var(--destructive));
        }

        .entity-empty-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding-top: 3rem;
          padding-bottom: 3rem;
        }

        .entity-empty-content {
          text-align: center;
          color: hsl(var(--muted-foreground));
        }

        .entity-empty-icon {
          height: 3rem;
          width: 3rem;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 0.5rem;
          opacity: 0.5;
        }

        .entity-empty-hint {
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

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

        .entity-card-content {
          padding: 1rem;
        }

        .entity-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .entity-card-icon {
          height: 2rem;
          width: 2rem;
          color: hsl(var(--primary));
        }

        .entity-card-badge {
          font-size: 0.75rem;
        }

        .entity-card-title {
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .entity-card-subject {
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
          margin-bottom: 0.5rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .entity-card-description {
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <div className="entity-grid">
        {filteredEntities.map((entity) => (
          <Card
            key={entity.id}
            className="entity-card"
            onClick={() => onEntityClick(entity)}
          >
            <CardContent className="entity-card-content">
              <div className="entity-card-header">
                <Database className="entity-card-icon" />
                <Badge variant={entity.is_delta ? "default" : "secondary"} className="entity-card-badge">
                  {entity.type}
                </Badge>
              </div>
              <h3 className="entity-card-title" title={entity.name}>
                {entity.name}
              </h3>
              <p className="entity-card-subject" title={entity.subjectarea.name}>
                {entity.subjectarea.name}
              </p>
              {entity.description && (
                <p className="entity-card-description" title={entity.description}>
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