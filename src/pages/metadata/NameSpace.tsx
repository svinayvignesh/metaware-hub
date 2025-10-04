/**
 * NameSpace Management Page
 * 
 * This component provides a comprehensive interface for managing namespaces
 * within the MetaWare metadata management system. Namespaces represent
 * logical boundaries for organizing data entities.
 * 
 * Features:
 * - Display all namespaces in a searchable, filterable table
 * - CRUD operations (Create, Read, Update, Delete)
 * - Real-time data synchronization with GraphQL API
 * - Inline editing capabilities
 * - Bulk operations support
 * 
 * @author MetaWare Development Team
 * @version 1.0.0
 */

import { useQuery } from '@apollo/client/react/hooks';
import { DataTable, Column, TableData } from "@/components/table/DataTable";
import { GET_NAMESPACES, type GetNamespacesResponse } from "@/graphql/queries";
import { namespaceAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";


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

/**
 * Column configuration for the namespace table
 * Defines the structure and display properties for each column
 */
const namespaceColumns: Column[] = [
  { key: 'name', title: 'Name', type: 'text', required: true },
  { 
    key: 'type', 
    title: 'Type', 
    type: 'select',
    options: ['staging', 'glossary', 'model', 'reference'],
    required: true,
    renderCell: (row, isEditing, onChange) => {
      if (isEditing) {
        return (
          <Select
            value={row.type || ''}
            onValueChange={onChange}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {['staging', 'glossary', 'model', 'reference'].map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      return (
        <Badge variant={getTypeBadgeVariant(row.type)}>
          {row.type}
        </Badge>
      );
    }
  },
  { key: 'status', title: 'Status', type: 'text' },
  { key: 'tags', title: 'Tags', type: 'text' },
];

/**
 * NameSpace Management Component
 * 
 * Renders the namespace management interface with real-time data
 * from the GraphQL API and provides full CRUD functionality.
 */
export default function NameSpace() {
  const { toast } = useToast();
  
  /**
   * GraphQL query to fetch all namespaces
   * Handles loading states, errors, and data updates automatically
   */
  const { data, loading, error, refetch } = useQuery<GetNamespacesResponse>(GET_NAMESPACES);

  /**
   * Transform GraphQL data to table format
   * Converts the namespace data structure to match DataTable requirements
   */
  const tableData: TableData[] = data?.meta_namespace.map(namespace => ({
    id: namespace.id,
    name: namespace.name,
    status: namespace.status,
    type: namespace.type,
    tags: Array.isArray(namespace.tags) ? namespace.tags.join(', ') : namespace.tags || '',
  })) || [];

  /**
   * Handle adding new namespace
   */
  const handleAdd = async (newRow: Partial<TableData>) => {
    try {
      const namespaceData = {
        id: newRow.id || '',
        type: newRow.type || '',
        name: newRow.name || '',
        runtime: '',
        privilege: '',
        tags: newRow.tags || '',
        custom_props: '',
        github_repo: '',
        status: 'Active',
        update_strategy_: 'I',
        namespace_id: newRow.id || '',
      };

      await namespaceAPI.create([namespaceData]);
      await refetch();
      toast({
        title: "Success",
        description: "Namespace created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create namespace: ${error}`,
        variant: "destructive",
      });
    }
  };

  /**
   * Handle editing existing namespace
   */
  const handleEdit = async (id: string, updatedData: Partial<TableData>) => {
    try {
      // For now, we'll use create API for updates (as update endpoint wasn't provided)
      const existingNamespace = tableData.find(item => item.id === id);
      if (!existingNamespace) return;

      const namespaceData = {
        ...existingNamespace,
        ...updatedData,
        update_strategy_: 'U',
      };

      await namespaceAPI.create([namespaceData]);
      await refetch();
      toast({
        title: "Success",
        description: "Namespace updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update namespace: ${error}`,
        variant: "destructive",
      });
    }
  };

  /**
   * Handle deleting namespaces
   */
  const handleDelete = async (ids: string[]) => {
    try {
      await namespaceAPI.delete(ids);
      await refetch();
      toast({
        title: "Success",
        description: `${ids.length} namespace(s) deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete namespaces: ${error}`,
        variant: "destructive",
      });
    }
  };

  /**
   * Handle bulk save operations
   */
  const handleSave = async (data: TableData[]) => {
    try {
      const namespacesToSave = data
        .map(item => {
          const isNewRecord = item._status === 'draft';
          
          if (isNewRecord) {
            // For new records, send all required fields
            return {
              type: item.type || '',
              name: item.name || '',
              runtime: '',
              privilege: '',
              tags: item.tags || '',
              custom_props: '',
              github_repo: '',
              status: item.status || 'Active',
              update_strategy_: 'I',
            };
          } else {
            // For edited records, send all required fields plus changed fields
            const originalRow = tableData.find(row => row.id === item.id);
            let hasChanges = false;
            
            if (originalRow) {
              if (item.name !== originalRow.name ||
                  item.type !== originalRow.type ||
                  item.status !== originalRow.status ||
                  item.tags !== originalRow.tags) {
                hasChanges = true;
              }
            }
            
            // Only return if there are actual changes
            if (!hasChanges) return null;
            
            return {
              id: item.id,
              type: item.type || '',
              name: item.name || '',
              status: item.status || 'Active',
              tags: item.tags || '',
              update_strategy_: 'U',
            };
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      // Only proceed if there are records to save
      if (namespacesToSave.length === 0) {
        toast({
          title: "No changes",
          description: "No changes to save",
        });
        return;
      }

      await namespaceAPI.create(namespacesToSave);
      await refetch();
      toast({
        title: "Success",
        description: "Changes saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save changes: ${error}`,
        variant: "destructive",
      });
    }
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">NameSpace Management</h1>
          <p className="text-muted-foreground">
            Manage logical boundaries and organize your data entities
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading namespaces...</div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">NameSpace Management</h1>
          <p className="text-muted-foreground">
            Manage logical boundaries and organize your data entities
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-destructive">
            Error loading namespaces: {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Metadata</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>NameSpace</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">NameSpace Management</h1>
        <p className="text-muted-foreground">
          Manage logical boundaries and organize your data entities
        </p>
      </div>

      {/* Data Table with GraphQL Integration */}
      <DataTable
        columns={namespaceColumns}
        data={tableData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSave={handleSave}
        entityType="Namespace"
      />
    </div>
  );
}