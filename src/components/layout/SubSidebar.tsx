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
    <div className="w-64 border-r border-border bg-background overflow-y-auto z-30">
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
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-all duration-200 ease-in-out hover:scale-[1.02]"
                >
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-300 ease-in-out",
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
                        "w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 ease-in-out",
                        selectedSubjectAreaId === sa.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-accent hover:scale-[1.02] hover:shadow-sm"
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
