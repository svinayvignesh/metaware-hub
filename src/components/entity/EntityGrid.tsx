import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { Search, Package } from "lucide-react";
import { GET_ENTITIES } from "@/graphql/queries/entity";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EntityGridProps {
  subjectAreaId?: string;
  namespaceType: string;
  onEntityClick?: (entity: any) => void;
}

export const EntityGrid = ({ subjectAreaId, namespaceType, onEntityClick }: EntityGridProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: entitiesData, loading } = useQuery(GET_ENTITIES, {
    variables: subjectAreaId ? { type: namespaceType } : undefined,
  });

  const entities = useMemo(() => {
    let filtered = entitiesData?.entities || [];

    // Filter by subject area if provided
    if (subjectAreaId) {
      filtered = filtered.filter((entity: any) => entity.sa_id === subjectAreaId);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entity: any) =>
        entity.name.toLowerCase().includes(query) ||
        entity.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [entitiesData, subjectAreaId, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading entities...
        </div>
      ) : entities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Package className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm">
            {searchQuery ? "No entities found matching your search" : "No entities found"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {entities.map((entity: any) => (
            <Card
              key={entity.id}
              onClick={() => onEntityClick?.(entity)}
              className={cn(
                "p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                "hover:shadow-lg hover:scale-105 hover:border-primary/50",
                "aspect-square"
              )}
            >
              <Package className="h-12 w-12 mb-3 text-primary" />
              <h3 className="font-semibold text-sm mb-2 line-clamp-2">{entity.name}</h3>
              {entity.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {entity.description}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
