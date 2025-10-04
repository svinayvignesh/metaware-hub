/**
 * Subject Area Management Page
 * 
 * This component provides a comprehensive interface for managing subject areas
 * within the MetaWare metadata management system. Subject areas represent
 * logical groupings of related entities within a namespace.
 * 
 * Features:
 * - Display all subject areas with their namespace relationships
 * - CRUD operations (Create, Read, Update, Delete)
 * - Real-time data synchronization with GraphQL API
 * - Inline editing capabilities
 * - Nested namespace information display
 * 
 * @author MetaWare Development Team
 * @version 1.0.0
 */

import { useState } from 'react';
import { useQuery } from '@apollo/client/react/hooks';
import { DataTable, Column, TableData } from "@/components/table/DataTable";
import { GET_SUBJECTAREAS, GET_NAMESPACES, type GetSubjectAreasResponse, type GetNamespacesResponse } from "@/graphql/queries";
import { subjectAreaAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { GroupedNamespaceSelect } from "@/components/table/GroupedNamespaceSelect";
import { Badge } from "@/components/ui/badge";
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
 * Column configuration for the subject area table
 * Defines the structure and display properties for each column
 */
const subjectAreaColumns: Column[] = [
  { key: 'name', title: 'Subject Area Name', type: 'text', required: true },
  { key: 'namespace_display', title: 'NameSpace', type: 'text', required: true },
  { key: 'type', title: 'Type', type: 'text' },
  { key: 'tags', title: 'Tags', type: 'text' },
];

/**
 * Subject Area Management Component
 * 
 * Renders the subject area management interface with real-time data
 * from the GraphQL API and provides full CRUD functionality.
 */
export default function SubjectArea() {
  const { toast } = useToast();
  const [editedData, setEditedData] = useState<TableData[]>([]);
  
  /**
   * GraphQL queries to fetch all subject areas and namespaces
   * Handles loading states, errors, and data updates automatically
   */
  const { data, loading, error, refetch } = useQuery<GetSubjectAreasResponse>(GET_SUBJECTAREAS);
  const { data: namespacesData } = useQuery<GetNamespacesResponse>(GET_NAMESPACES);

  /**
   * Transform GraphQL data to table format with namespace display as "type->namespace"
   */
  const tableData: TableData[] = data?.meta_subjectarea.map(subjectArea => ({
    id: subjectArea.id,
    name: subjectArea.name,
    namespace_display: `${subjectArea.namespace.type}->${subjectArea.namespace.name}`,
    namespace_name: subjectArea.namespace.name,
    namespace_type: subjectArea.namespace.type,
    type: subjectArea.type,
    tags: Array.isArray(subjectArea.tags) ? subjectArea.tags.join(', ') : subjectArea.tags || '',
    ns_id: subjectArea.ns_id,
  })) || [];

  const namespaces = namespacesData?.meta_namespace || [];

  /**
   * Handle cell edits with special logic for namespace changes
   */
  const handleCustomCellEdit = (id: string, key: string, value: string) => {
    if (key === 'ns_id') {
      // When namespace changes, update all related fields
      const selectedNs = namespaces.find(ns => ns.id === value);
      if (selectedNs) {
        setEditedData(prev =>
          prev.map(row =>
            row.id === id
              ? {
                  ...row,
                  ns_id: value,
                  namespace_display: `${selectedNs.type}->${selectedNs.name}`,
                  namespace_name: selectedNs.name,
                  namespace_type: selectedNs.type,
                  _status: row._status === 'draft' ? 'draft' : 'edited'
                }
              : row
          )
        );
      }
    }
  };

  // Update columns with custom renderCell for namespace
  const columnsWithRender: Column[] = subjectAreaColumns.map(col => {
    if (col.key === 'namespace_display') {
      return {
        ...col,
        renderCell: (row: TableData, isEditing: boolean, onChange: (value: string) => void) => {
          if (isEditing) {
            return (
              <GroupedNamespaceSelect
                namespaces={namespaces}
                value={row.ns_id || ''}
                onChange={(nsId) => handleCustomCellEdit(row.id, 'ns_id', nsId)}
                placeholder="Select namespace..."
                showTypePrefix={true}
                className="h-8"
              />
            );
          }
          return (
            <div className="flex items-center gap-2">
              <Badge variant={getTypeBadgeVariant(row.namespace_type)} className="text-[10px] px-1.5 py-0">
                {row.namespace_type}
              </Badge>
              <span>{row.namespace_name}</span>
            </div>
          );
        }
      };
    }
    return col;
  });


  /**
   * Handle editing existing subject area
   */
  const handleEdit = async (id: string, updatedData: Partial<TableData>) => {
    try {
      const existingSubjectArea = tableData.find(item => item.id === id);
      if (!existingSubjectArea) return;

      const subjectAreaData = {
        ...existingSubjectArea,
        ...updatedData,
        update_strategy_: 'U',
      };

      await subjectAreaAPI.create([subjectAreaData]);
      await refetch();
      toast({
        title: "Success",
        description: "Subject area updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update subject area: ${error}`,
        variant: "destructive",
      });
    }
  };

  /**
   * Handle deleting subject areas
   */
  const handleDelete = async (ids: string[]) => {
    try {
      await subjectAreaAPI.delete(ids);
      await refetch();
      toast({
        title: "Success",
        description: `${ids.length} subject area(s) deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete subject areas: ${error}`,
        variant: "destructive",
      });
    }
  };

  /**
   * Handle bulk save operations
   */
  const handleSave = async (data: TableData[]) => {
    try {
      const subjectAreasToSave = data
        .map(item => {
          const isNewRecord = item._status === 'draft';
          
          if (isNewRecord) {
            // For new records, send all required fields
            return {
              type: item.type || '',
              name: item.name || '',
              tags: item.tags || '',
              custom_props: '',
              ns_id: item.ns_id || '',
              update_strategy_: 'I',
              ns: item.namespace_name || '',
            };
          } else {
            // For edited records, send all required fields plus changed fields
            const originalRow = tableData.find(row => row.id === item.id);
            let hasChanges = false;
            
            if (originalRow) {
              if (item.name !== originalRow.name ||
                  item.type !== originalRow.type ||
                  item.tags !== originalRow.tags ||
                  item.ns_id !== originalRow.ns_id) {
                hasChanges = true;
              }
            }
            
            // Only return if there are actual changes
            if (!hasChanges) return null;
            
            return {
              id: item.id,
              type: item.type || '',
              name: item.name || '',
              tags: item.tags || '',
              ns_id: item.ns_id || '',
              ns: item.namespace_name || '',
              custom_props: '',
              update_strategy_: 'U',
            };
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      // Only proceed if there are records to save
      if (subjectAreasToSave.length === 0) {
        toast({
          title: "No changes",
          description: "No changes to save",
        });
        return;
      }

      await subjectAreaAPI.create(subjectAreasToSave);
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
          <h1 className="text-2xl font-bold text-foreground">Subject Area Management</h1>
          <p className="text-muted-foreground">
            Organize related entities within logical business domains
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading subject areas...</div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subject Area Management</h1>
          <p className="text-muted-foreground">
            Organize related entities within logical business domains
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-destructive">
            Error loading subject areas: {error.message}
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
            <BreadcrumbPage>Subject Area</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subject Area Management</h1>
        <p className="text-muted-foreground">
          Organize related entities within logical business domains
        </p>
      </div>

      {/* Data Table with GraphQL Integration */}
      <DataTable
        columns={columnsWithRender}
        data={tableData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSave={handleSave}
        entityType="Subject Area"
        externalEditedData={editedData}
        onEditedDataChange={setEditedData}
      />
    </div>
  );
}