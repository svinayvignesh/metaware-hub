import { useState } from "react";
import { useQuery } from "@apollo/client/react/hooks";
import { ChevronDown, ChevronRight } from "lucide-react";
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

  const namespaces = namespacesData?.meta_namespace?.filter(ns => ns.type.toLowerCase() === namespaceType.toLowerCase()) || [];
  const allSubjectAreas = subjectAreasData?.meta_subjectarea || [];

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
    <div className="w-64 border-r border-border bg-background overflow-y-auto">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-4">
          {namespaceType} Namespaces
        </h2>
        <div className="space-y-1">
          {namespaces.map((namespace) => {
            const isExpanded = expandedNamespaces.has(namespace.id);
            const subjectAreas = allSubjectAreas.filter(sa => sa.ns_id === namespace.id);

            return (
              <div key={namespace.id}>
                <button
                  onClick={() => toggleNamespace(namespace.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="flex-1 text-left truncate">{namespace.name}</span>
                  <span className="text-xs text-muted-foreground">({subjectAreas.length})</span>
                </button>

                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {subjectAreas.map((sa) => (
                      <button
                        key={sa.id}
                        onClick={() => onSubjectAreaSelect(sa.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                          selectedSubjectAreaId === sa.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        )}
                      >
                        {sa.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
