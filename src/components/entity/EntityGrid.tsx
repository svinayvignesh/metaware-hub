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
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading entities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-destructive">Error loading entities: {error.message}</div>
      </div>
    );
  }

  if (filteredEntities.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-muted-foreground">
          <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No entities found</p>
          {searchQuery && <p className="text-sm mt-1">Try adjusting your search</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredEntities.map((entity) => (
        <Card
          key={entity.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onEntityClick(entity)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <Database className="h-8 w-8 text-primary" />
              <Badge variant={entity.is_delta ? "default" : "secondary"} className="text-xs">
                {entity.type}
              </Badge>
            </div>
            <h3 className="font-semibold text-sm mb-2 truncate" title={entity.name}>
              {entity.name}
            </h3>
            <p className="text-xs text-muted-foreground mb-2 truncate" title={entity.subjectarea.name}>
              {entity.subjectarea.name}
            </p>
            {entity.description && (
              <p className="text-xs text-muted-foreground line-clamp-2" title={entity.description}>
                {entity.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
