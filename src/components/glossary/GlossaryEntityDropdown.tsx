import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { ChevronRight, Database } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  placeholder = "Select Business Glossary (Blueprint)",
}: GlossaryEntityDropdownProps) {
  const [open, setOpen] = useState(false);
  const [hoveredNamespace, setHoveredNamespace] = useState<string | null>(null);
  const [hoveredSubjectArea, setHoveredSubjectArea] = useState<string | null>(null);

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
    setHoveredNamespace(null);
    setHoveredSubjectArea(null);
  };

  const loading = namespacesLoading || subjectAreasLoading || entitiesLoading;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedEntity ? (
            <span className="flex items-center gap-1.5 text-sm">
              <Database className="h-4 w-4 shrink-0" />
              <span className="font-medium">{selectedEntity.subjectarea.namespace.name}</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{selectedEntity.subjectarea.name}</span>
              <span className="text-muted-foreground">/</span>
              <span>{selectedEntity.name}</span>
            </span>
          ) : (
            placeholder
          )}
          <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search glossary entities..." />
          <CommandList>
            <CommandEmpty>No glossary entities found.</CommandEmpty>
            {loading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              glossaryNamespaces.map((namespace: Namespace) => {
                const subjectAreas = subjectAreasByNamespace[namespace.id] || [];
                
                return (
                  <CommandGroup key={namespace.id} heading={namespace.name}>
                    {subjectAreas.map((sa: SubjectArea) => {
                      const entities = entitiesBySubjectArea[sa.id] || [];
                      
                      return (
                        <div key={sa.id} className="relative group">
                          <div
                            className="flex items-center justify-between px-2 py-1.5 text-sm hover:bg-accent cursor-pointer rounded-sm transition-colors"
                            onMouseEnter={() => {
                              setHoveredNamespace(namespace.id);
                              setHoveredSubjectArea(sa.id);
                            }}
                          >
                            <span className="font-medium">{sa.name}</span>
                            {entities.length > 0 && (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          
                          {hoveredNamespace === namespace.id &&
                            hoveredSubjectArea === sa.id &&
                            entities.length > 0 && (
                              <div
                                className="absolute left-full top-0 ml-1 bg-popover border rounded-md shadow-lg p-1 w-64 z-[100]"
                                onMouseLeave={() => {
                                  setHoveredNamespace(null);
                                  setHoveredSubjectArea(null);
                                }}
                              >
                                {entities.map((entity: Entity) => (
                                  <div
                                    key={entity.id}
                                    onClick={() => handleSelect(entity)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-sm cursor-pointer transition-colors"
                                  >
                                    <Database className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span>{entity.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </CommandGroup>
                );
              })
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
