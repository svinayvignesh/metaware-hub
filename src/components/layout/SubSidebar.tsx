import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client/react/hooks";
import { ChevronDown } from "lucide-react";
import { GET_NAMESPACES, GET_SUBJECTAREAS, type GetNamespacesResponse, type GetSubjectAreasResponse } from "@/graphql/queries";
import { cn } from "@/lib/utils";

interface SubSidebarProps {
  namespaceType: string;
  onSubjectAreaSelect: (subjectAreaId: string | null) => void;
  selectedSubjectAreaId?: string;
}

export function SubSidebar({ namespaceType, onSubjectAreaSelect, selectedSubjectAreaId }: SubSidebarProps) {
  const [expandedNamespaces, setExpandedNamespaces] = useState<Set<string>>(new Set());

  const { data: namespacesData } = useQuery<GetNamespacesResponse>(GET_NAMESPACES);
  const { data: subjectAreasData } = useQuery<GetSubjectAreasResponse>(GET_SUBJECTAREAS);

  const namespaces = useMemo(
    () => (namespacesData?.meta_namespace ?? []).filter(ns => ns.type.toLowerCase() === namespaceType.toLowerCase()),
    [namespacesData, namespaceType]
  );

  const subjectAreasByNs = useMemo(() => {
    const all = subjectAreasData?.meta_subjectarea ?? [];
    const map = new Map<string, typeof all>();
    for (const sa of all) {
      if (!map.has(sa.ns_id)) map.set(sa.ns_id, []);
      map.get(sa.ns_id)!.push(sa);
    }
    return map;
  }, [subjectAreasData]);

  const toggleNamespace = (namespaceId: string) => {
    const newExpanded = new Set(expandedNamespaces);
    if (newExpanded.has(namespaceId)) {
      newExpanded.delete(namespaceId);
    } else {
      newExpanded.add(namespaceId);
    }
    setExpandedNamespaces(newExpanded);
  };

  return (
    <div className="w-64 border-r border-border bg-background overflow-y-auto z-30">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-4">
          {namespaceType} Namespaces
        </h2>
        <div className="space-y-1">
          {namespaces.map((namespace) => {
            const isExpanded = expandedNamespaces.has(namespace.id);
            const subjectAreas = subjectAreasByNs.get(namespace.id) ?? [];

            return (
              <div key={namespace.id}>
                <button
                  onClick={() => toggleNamespace(namespace.id)}
                  className="button-anim w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transform-gpu will-change-transform hover:scale-[1.02]"
                >
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 text-muted-foreground transform-gpu will-change-transform transition-transform duration-300 ease-in-out",
                      !isExpanded && "-rotate-90"
                    )} 
                  />
                  <span className="flex-1 text-left truncate">{namespace.name}</span>
                  <span className="text-xs text-muted-foreground">({subjectAreas.length})</span>
                </button>

                <div 
                  className={cn(
                    "ml-6 space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
                    isExpanded ? "mt-1 max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  {subjectAreas.map((sa) => (
                    <button
                      key={sa.id}
                      onClick={() => onSubjectAreaSelect(sa.id)}
                      className={cn(
                        "listitem-anim w-full text-left px-3 py-2 text-sm rounded-md transform-gpu will-change-transform",
                        selectedSubjectAreaId === sa.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent hover:scale-[1.02]"
                      )}
                    >
                      {sa.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
