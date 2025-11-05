import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { ChevronRight, Database } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GET_NAMESPACES } from "@/graphql/queries/namespace";
import { GET_SUBJECTAREAS } from "@/graphql/queries/subjectarea";
import { GET_ENTITIES } from "@/graphql/queries/entity";
import type { Namespace } from "@/graphql/queries/namespace";
import type { SubjectArea } from "@/graphql/queries/subjectarea";
import type { Entity } from "@/graphql/queries/entity";

interface GlossaryEntityDropdownProps {
  value?: string;
  onSelect: (entity: Entity) => void;
  placeholder?: string;
}

export function GlossaryEntityDropdown({
  value,
  onSelect,
  placeholder = "Blueprint Meta Data",
}: GlossaryEntityDropdownProps) {
  const [open, setOpen] = useState(false);

  const { data: namespacesData, loading: namespacesLoading } = useQuery(GET_NAMESPACES);
  const { data: subjectAreasData, loading: subjectAreasLoading } = useQuery(GET_SUBJECTAREAS);
  const { data: entitiesData, loading: entitiesLoading } = useQuery(GET_ENTITIES);

  // Filter for glossary type namespaces
  const glossaryNamespaces = useMemo(() => {
    if (!namespacesData?.meta_namespace) return [];
    return namespacesData.meta_namespace.filter(
      (ns: Namespace) => ns.type === "glossary"
    );
  }, [namespacesData]);

  // Group subject areas by namespace
  const subjectAreasByNamespace = useMemo(() => {
    if (!subjectAreasData?.meta_subjectarea) return {};
    const grouped: Record<string, SubjectArea[]> = {};
    subjectAreasData.meta_subjectarea.forEach((sa: SubjectArea) => {
      const nsId = sa.namespace.id;
      if (!grouped[nsId]) {
        grouped[nsId] = [];
      }
      grouped[nsId].push(sa);
    });
    return grouped;
  }, [subjectAreasData]);

  // Group entities by subject area
  const entitiesBySubjectArea = useMemo(() => {
    if (!entitiesData?.meta_entity) return {};
    const grouped: Record<string, Entity[]> = {};
    entitiesData.meta_entity.forEach((entity: Entity) => {
      const saId = entity.sa_id;
      if (!grouped[saId]) {
        grouped[saId] = [];
      }
      // Only include entities from glossary type namespaces
      if (entity.subjectarea?.namespace?.type === "glossary") {
        grouped[saId].push(entity);
      }
    });
    return grouped;
  }, [entitiesData]);

  const selectedEntity = useMemo(() => {
    if (!value || !entitiesData?.meta_entity) return null;
    return entitiesData.meta_entity.find((e: Entity) => e.id === value);
  }, [value, entitiesData]);

  const handleSelect = (entity: Entity) => {
    onSelect(entity);
    setOpen(false);
  };

  const loading = namespacesLoading || subjectAreasLoading || entitiesLoading;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedEntity ? (
            <span className="flex-start gap-1.5 text-sm">
              <Database className="icon-sm shrink-0" />
              <span className="font-medium">{selectedEntity.subjectarea?.namespace?.name}</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{selectedEntity.subjectarea?.name}</span>
              <span className="text-muted-foreground">/</span>
              <span>{selectedEntity.name}</span>
            </span>
          ) : (
            placeholder
          )}
          <ChevronRight className="ml-2 icon-sm shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[300px]" align="start">
        {loading ? (
          <div className="card-padding-sm stack-sm">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : glossaryNamespaces.length === 0 ? (
          <div className="card-padding-sm text-muted text-center">
            No glossary namespaces found
          </div>
        ) : (
          glossaryNamespaces.map((namespace: Namespace) => {
            const subjectAreas = subjectAreasByNamespace[namespace.id] || [];
            
            if (subjectAreas.length === 0) return null;
            
            return (
              <DropdownMenuSub key={namespace.id}>
                <DropdownMenuSubTrigger className="flex-start gap-sm">
                  <Database className="icon-sm shrink-0" />
                  <span>{namespace.name}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {subjectAreas.map((sa: SubjectArea) => {
                    const entities = entitiesBySubjectArea[sa.id] || [];
                    
                    if (entities.length === 0) return null;
                    
                    return (
                      <DropdownMenuSub key={sa.id}>
                        <DropdownMenuSubTrigger className="flex-start gap-sm">
                          <span>{sa.name}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {entities.map((entity: Entity) => (
                            <DropdownMenuItem
                              key={entity.id}
                              onClick={() => handleSelect(entity)}
                              className="flex-start gap-sm cursor-pointer"
                            >
                              <Database className="icon-sm shrink-0 icon-muted" />
                              <span>{entity.name}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
