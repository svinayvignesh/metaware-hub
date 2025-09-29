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
  showTypePrefix?: boolean; // Show "type->namespace" format
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
  // Group namespaces by type
  const groupedNamespaces = namespaces.reduce((groups, namespace) => {
    const type = namespace.type || 'Other';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(namespace);
    return groups;
  }, {} as Record<string, Namespace[]>);

  // Get display value
  const selectedNamespace = namespaces.find(ns => ns.id === value);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {selectedNamespace && showTypePrefix && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {selectedNamespace.type}
              </Badge>
              <span>{selectedNamespace.name}</span>
            </div>
          )}
          {selectedNamespace && !showTypePrefix && selectedNamespace.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-popover z-50">
        {Object.entries(groupedNamespaces).map(([type, typeNamespaces]) => (
          <div key={type}>
            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
              {type}
            </div>
            {typeNamespaces.map((namespace) => (
              <SelectItem 
                key={namespace.id} 
                value={namespace.id} 
                className="pl-6"
              >
                {showTypePrefix ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
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
  );
};
