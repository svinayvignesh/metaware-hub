import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { GET_NAMESPACES } from "@/graphql/queries/namespace";
import { GET_SUBJECTAREAS } from "@/graphql/queries/subjectarea";
import { cn } from "@/lib/utils";

interface SubSidebarProps {
  namespaceType: string;
  onSubjectAreaSelect: (subjectArea: any) => void;
  selectedSubjectAreaId?: string;
}

export const SubSidebar = ({ 
  namespaceType, 
  onSubjectAreaSelect,
  selectedSubjectAreaId 
}: SubSidebarProps) => {
  const [expandedNamespaces, setExpandedNamespaces] = useState<string[]>([]);

  const { data: namespacesData, loading: namespacesLoading } = useQuery(GET_NAMESPACES, {
    variables: { type: namespaceType },
  });

  const { data: subjectAreasData } = useQuery(GET_SUBJECTAREAS);

  const namespaces = namespacesData?.namespaces || [];
  const allSubjectAreas = subjectAreasData?.subjectareas || [];

  const toggleNamespace = (namespaceId: string) => {
    setExpandedNamespaces(prev =>
      prev.includes(namespaceId)
        ? prev.filter(id => id !== namespaceId)
        : [...prev, namespaceId]
    );
  };

  const getSubjectAreasForNamespace = (namespaceId: string) => {
    return allSubjectAreas.filter((sa: any) => sa.ns_id === namespaceId);
  };

  if (namespacesLoading) {
    return (
      <aside className="w-64 border-r border-border bg-card h-[calc(100vh-3.5rem)] overflow-y-auto">
        <div className="p-4 text-sm text-muted-foreground">Loading...</div>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r border-border bg-card h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
          {namespaceType} Namespaces
        </h2>
        <nav className="space-y-1">
          {namespaces.map((namespace: any) => {
            const isExpanded = expandedNamespaces.includes(namespace.id);
            const subjectAreas = getSubjectAreasForNamespace(namespace.id);

            return (
              <div key={namespace.id}>
                <button
                  onClick={() => toggleNamespace(namespace.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                  {isExpanded ? (
                    <FolderOpen className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <Folder className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="truncate">{namespace.name}</span>
                </button>

                {isExpanded && subjectAreas.length > 0 && (
                  <div className="ml-6 mt-1 space-y-1">
                    {subjectAreas.map((sa: any) => (
                      <button
                        key={sa.id}
                        onClick={() => onSubjectAreaSelect(sa)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                          "hover:bg-accent hover:text-accent-foreground",
                          selectedSubjectAreaId === sa.id && "bg-accent text-accent-foreground"
                        )}
                      >
                        <span className="truncate">{sa.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
