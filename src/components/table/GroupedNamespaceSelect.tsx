/**
 * Grouped Namespace Select Component
 * 
 * A reusable dropdown component that displays namespaces grouped by type.
 * Used across metadata management pages for consistent namespace selection.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

/**
 * Helper function to get badge variant for namespace type
 */
const getTypeBadgeVariant = (type: string): "staging" | "glossary" | "model" | "reference" => {
  const typeMap: Record<string, "staging" | "glossary" | "model" | "reference"> = {
    'staging': 'staging',
    'glossary': 'glossary',
    'model': 'model',
    'reference': 'reference',
  };
  return typeMap[type.toLowerCase()] || 'staging';
};

interface Namespace {
  id: string;
  name: string;
  type: string;
}

interface GroupedNamespaceSelectProps {
  namespaces: Namespace[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showTypePrefix?: boolean;
}

export const GroupedNamespaceSelect = ({
  namespaces,
  value,
  onChange,
  placeholder = "Select namespace...",
  disabled = false,
  className = "",
  showTypePrefix = false,
}: GroupedNamespaceSelectProps) => {
  const groupedNamespaces = namespaces.reduce((groups, namespace) => {
    const type = namespace.type || 'Other';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(namespace);
    return groups;
  }, {} as Record<string, Namespace[]>);

  const selectedNamespace = namespaces.find(ns => ns.id === value);

  return (
    <>
      <style>{`
        .grouped-namespace-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .grouped-namespace-badge-icon {
          font-size: 0.625rem;
          padding-left: 0.375rem;
          padding-right: 0.375rem;
          padding-top: 0;
          padding-bottom: 0;
        }

        .grouped-namespace-content {
          background-color: hsl(var(--popover));
          z-index: 50;
          border: 1px solid hsl(var(--border));
        }

        .grouped-namespace-header {
          padding-left: 0.5rem;
          padding-right: 0.5rem;
          padding-top: 0.375rem;
          padding-bottom: 0.375rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
        }

        .grouped-namespace-item {
          padding-left: 1.5rem;
        }
      `}</style>

      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder}>
            {selectedNamespace && showTypePrefix && (
              <div className="grouped-namespace-badge">
                <Badge variant={getTypeBadgeVariant(selectedNamespace.type)} className="grouped-namespace-badge-icon">
                  {selectedNamespace.type}
                </Badge>
                <span>{selectedNamespace.name}</span>
              </div>
            )}
            {selectedNamespace && !showTypePrefix && selectedNamespace.name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="grouped-namespace-content">
          {Object.entries(groupedNamespaces).map(([type, typeNamespaces]) => (
            <div key={type}>
              <div className="grouped-namespace-header">
                {type}
              </div>
              {typeNamespaces.map((namespace) => (
                <SelectItem 
                  key={namespace.id} 
                  value={namespace.id} 
                  className="grouped-namespace-item"
                >
                  {showTypePrefix ? (
                    <div className="grouped-namespace-badge">
                      <Badge variant={getTypeBadgeVariant(namespace.type)} className="grouped-namespace-badge-icon">
                        {namespace.type}
                      </Badge>
                      <span>{namespace.name}</span>
                    </div>
                  ) : (
                    namespace.name
                  )}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};