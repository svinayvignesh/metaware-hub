import { useState, useMemo, useEffect } from "react";
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

  // Expand the first namespace by default
  useEffect(() => {
    if (namespaces.length > 0 && expandedNamespaces.size === 0) {
      setExpandedNamespaces(new Set([namespaces[0].id]));
    }
  }, [namespaces]);

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
    <>
      <style>{`
        .subsidebar-container {
          width: 16rem;
          border-right: 1px solid hsl(var(--border));
          background-color: hsl(var(--background));
          overflow-y: auto;
          z-index: 30;
        }

        .subsidebar-content {
          padding: 1rem;
        }

        .subsidebar-header {
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          text-transform: uppercase;
          margin-bottom: 1rem;
        }

        .subsidebar-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .subsidebar-namespace-button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          border-radius: 0.375rem;
          will-change: transform;
          transform: translateZ(0);
        }

        .subsidebar-namespace-button:hover {
          background-color: hsl(var(--accent));
          transform: scale(1.02);
        }

        .subsidebar-chevron {
          height: 1rem;
          width: 1rem;
          color: hsl(var(--muted-foreground));
          will-change: transform;
          transform: translateZ(0);
          transition: transform 300ms ease-in-out;
        }

        .subsidebar-chevron-collapsed {
          transform: rotate(-90deg);
        }

        .subsidebar-namespace-name {
          flex: 1;
          text-align: left;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .subsidebar-count {
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
        }

        .subsidebar-subjects-container {
          margin-left: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          overflow: hidden;
          transition: all 300ms ease-in-out;
        }

        .subsidebar-subjects-expanded {
          margin-top: 0.25rem;
          max-height: 125rem;
          opacity: 1;
        }

        .subsidebar-subjects-collapsed {
          max-height: 0;
          opacity: 0;
        }

        .subsidebar-subject-button {
          width: 100%;
          text-align: left;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          border-radius: 0.375rem;
          will-change: transform;
          transform: translateZ(0);
        }

        .subsidebar-subject-button:hover {
          background-color: hsl(var(--accent));
          transform: scale(1.02);
        }

        .subsidebar-subject-button-active {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
      `}</style>

      <div className="subsidebar-container">
        <div className="subsidebar-content">
          <h2 className="subsidebar-header">
            {namespaceType} Namespaces
          </h2>
          <div className="subsidebar-list">
            {namespaces.map((namespace) => {
              const isExpanded = expandedNamespaces.has(namespace.id);
              const subjectAreas = subjectAreasByNs.get(namespace.id) ?? [];

              return (
                <div key={namespace.id}>
                  <button
                    onClick={() => toggleNamespace(namespace.id)}
                    className="button-anim subsidebar-namespace-button"
                  >
                    <ChevronDown 
                      className={cn(
                        "subsidebar-chevron",
                        !isExpanded && "subsidebar-chevron-collapsed"
                      )} 
                    />
                    <span className="subsidebar-namespace-name">{namespace.name}</span>
                    <span className="subsidebar-count">({subjectAreas.length})</span>
                  </button>

                  <div 
                    className={cn(
                      "subsidebar-subjects-container",
                      isExpanded ? "subsidebar-subjects-expanded" : "subsidebar-subjects-collapsed"
                    )}
                  >
                    {subjectAreas.map((sa) => (
                      <button
                        key={sa.id}
                        onClick={() => onSubjectAreaSelect(sa.id)}
                        className={cn(
                          "listitem-anim subsidebar-subject-button",
                          selectedSubjectAreaId === sa.id && "subsidebar-subject-button-active"
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
    </>
  );
}