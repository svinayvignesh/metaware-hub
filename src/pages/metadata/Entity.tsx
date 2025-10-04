/**
 * Entity Management Page
 * 
 * This component provides a comprehensive interface for managing entities
 * within the MetaWare metadata management system. Entities represent
 * individual data structures within subject areas.
 * 
 * Features:
 * - Display all entities with their hierarchical relationships
 * - CRUD operations (Create, Read, Update, Delete)
 * - Real-time data synchronization with GraphQL API
 * - Inline editing capabilities
 * - Nested subject area and namespace information display
 * 
 * @author MetaWare Development Team
 * @version 1.0.0
 */

import { useState } from 'react';
import { useQuery } from '@apollo/client/react/hooks';
import { DataTable, Column, TableData } from "@/components/table/DataTable";
import { GET_ENTITIES, GET_NAMESPACES, GET_SUBJECTAREAS, type GetEntitiesResponse, type GetNamespacesResponse, type GetSubjectAreasResponse } from "@/graphql/queries";
import { entityAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { GroupedNamespaceSelect } from "@/components/table/GroupedNamespaceSelect";
import { Badge } from "@/components/ui/badge";
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
 * Column configuration for the entity table
 * Defines the structure and display properties for each column
 */
const entityColumns: Column[] = [
  { key: 'name', title: 'Entity Name', type: 'text', required: true },
  { key: 'type', title: 'Type', type: 'text', required: true },
  { key: 'subtype', title: 'Subtype', type: 'text' },
  { key: 'description', title: 'Description', type: 'text' },
  { key: 'namespace_display', title: 'NameSpace', type: 'text', required: true },
  { key: 'subjectarea_display', title: 'Subject Area', type: 'text', required: true },
  { key: 'is_delta', title: 'Delta Enabled', type: 'text' },
  { key: 'primary_grain', title: 'Primary Grain', type: 'text' },
  { key: 'secondary_grain', title: 'Secondary Grain', type: 'text' },
  { key: 'tertiary_grain', title: 'Tertiary Grain', type: 'text' },
  { key: 'is_delta_bool', title: 'Is Delta', type: 'checkbox' },
  { key: 'runtime', title: 'Runtime', type: 'text' },
];

/**
 * Entity Management Component
 * 
 * Renders the entity management interface with real-time data
 * from the GraphQL API and provides full CRUD functionality.
 */
export default function Entity() {
  const { toast } = useToast();
  const [editedData, setEditedData] = useState<TableData[]>([]);
  
  /**
   * GraphQL queries to fetch entities, namespaces, and subject areas
   */
  const { data, loading, error, refetch } = useQuery<GetEntitiesResponse>(GET_ENTITIES);
  const { data: namespacesData } = useQuery<GetNamespacesResponse>(GET_NAMESPACES);
  const { data: subjectAreasData } = useQuery<GetSubjectAreasResponse>(GET_SUBJECTAREAS);

  const namespaces = namespacesData?.meta_namespace || [];
  const subjectAreas = subjectAreasData?.meta_subjectarea || [];

  /**
   * Transform GraphQL data to table format with namespace and subject area display
   */
  const tableData: TableData[] = data?.meta_entity.map(entity => {
    // Find the namespace ID by matching the namespace name
    const namespace = namespaces.find(ns => ns.name === entity.subjectarea.namespace.name);
    const nsId = namespace?.id || '';

    return {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      subtype: entity.subtype || '',
      description: entity.description || '',
      subjectarea_display: entity.subjectarea.name,
      subjectarea_name: entity.subjectarea.name,
      namespace_display: `${entity.subjectarea.namespace.type}->${entity.subjectarea.namespace.name}`,
      namespace_name: entity.subjectarea.namespace.name,
      namespace_type: entity.subjectarea.namespace.type,
      is_delta: entity.is_delta ? 'Yes' : 'No',
      primary_grain: entity.primary_grain || '',
      secondary_grain: entity.secondary_grain || '',
      tertiary_grain: entity.tertiary_grain || '',
      is_delta_bool: entity.is_delta || false,
      runtime: '',
      sa_id: entity.sa_id,
      ns_id: nsId,
    };
  }) || [];

  /**
   * Handle custom cell edits with cascading updates for namespace and subject area
   */
  const handleCustomCellEdit = (id: string, updates: Partial<TableData>) => {
    setEditedData(prev =>
      prev.map(row =>
        row.id === id
          ? {
              ...row,
              ...updates,
              _status: row._status === 'draft' ? 'draft' : 'edited'
            }
          : row
      )
    );
  };

  // Update columns with custom renderCell for namespace and subject area
  const columnsWithRender: Column[] = entityColumns.map(col => {
    if (col.key === 'namespace_display') {
      return {
        ...col,
        renderCell: (row: TableData, isEditing: boolean, onChange: (value: string) => void) => {
          if (isEditing) {
            return (
              <GroupedNamespaceSelect
                namespaces={namespaces}
                value={row.ns_id || ''}
                onChange={(nsId) => {
                  const selectedNs = namespaces.find(ns => ns.id === nsId);
                  if (selectedNs) {
                    handleCustomCellEdit(row.id, {
                      ns_id: nsId,
                      namespace_display: `${selectedNs.type}->${selectedNs.name}`,
                      namespace_name: selectedNs.name,
                      namespace_type: selectedNs.type,
                      // Clear subject area when namespace changes
                      subjectarea_display: '',
                      subjectarea_name: '',
                      sa_id: '',
                    });
                  }
                }}
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
    
    if (col.key === 'subjectarea_display') {
      return {
        ...col,
        renderCell: (row: TableData, isEditing: boolean, onChange: (value: string) => void) => {
          if (isEditing) {
            // Filter subject areas by selected namespace
            const availableSubjectAreas = subjectAreas.filter(sa => sa.ns_id === row.ns_id);
            
            return (
              <Select
                value={row.sa_id || ''}
                onValueChange={(saId) => {
                  const selectedSa = availableSubjectAreas.find(sa => sa.id === saId);
                  if (selectedSa) {
                    handleCustomCellEdit(row.id, {
                      sa_id: saId,
                      subjectarea_display: selectedSa.name,
                      subjectarea_name: selectedSa.name,
                    });
                  }
                }}
                disabled={!row.ns_id}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={row.ns_id ? "Select subject area..." : "Select namespace first"} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {availableSubjectAreas.map((sa) => (
                    <SelectItem key={sa.id} value={sa.id}>
                      {sa.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          return <span>{row.subjectarea_display}</span>;
        }
      };
    }
    
    return col;
  });


  /**
   * Handle editing existing entity
   */
  const handleEdit = async (id: string, updatedData: Partial<TableData>) => {
    try {
      const existingEntity = tableData.find(item => item.id === id);
      if (!existingEntity) return;

      const entityData = {
        type: updatedData.type || existingEntity.type,
        subtype: updatedData.subtype || existingEntity.subtype || '',
        name: updatedData.name || existingEntity.name,
        description: updatedData.description || existingEntity.description || '',
        is_delta: Boolean(updatedData.is_delta_bool ?? existingEntity.is_delta_bool),
        runtime: updatedData.runtime || existingEntity.runtime || '',
        tags: '',
        custom_props: [],
        dependency: '',
        primary_grain: updatedData.primary_grain || existingEntity.primary_grain || '',
        secondary_grain: updatedData.secondary_grain || existingEntity.secondary_grain || '',
        tertiary_grain: updatedData.tertiary_grain || existingEntity.tertiary_grain || '',
        sa_id: updatedData.sa_id || existingEntity.sa_id,
        ns: updatedData.namespace_name || existingEntity.namespace_name || '',
        sa: updatedData.subjectarea_name || existingEntity.subjectarea_name || '',
        en: updatedData.name || existingEntity.name,
        ns_type: existingEntity.namespace_type || updatedData.namespace_type || 'staging',
        update_strategy_: 'U',
      };

      await entityAPI.create([entityData]);
      await refetch();
      toast({
        title: "Success",
        description: "Entity updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update entity: ${error}`,
        variant: "destructive",
      });
    }
  };

  /**
   * Handle deleting entities
   */
  const handleDelete = async (ids: string[]) => {
    try {
      await entityAPI.delete(ids);
      await refetch();
      toast({
        title: "Success",
        description: `${ids.length} entit${ids.length === 1 ? 'y' : 'ies'} deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete entities: ${error}`,
        variant: "destructive",
      });
    }
  };

  /**
   * Handle bulk save operations
   */
  const handleSave = async (data: TableData[]) => {
    try {
      const entitiesToSave = data
        .map(item => {
          const isNewRecord = item._status === 'draft';
          
          if (isNewRecord) {
            // For new records, send all required fields
            return {
              type: item.type || '',
              subtype: item.subtype || '',
              name: item.name || '',
              description: item.description || '',
              is_delta: Boolean(item.is_delta_bool),
              runtime: item.runtime || '',
              tags: item.tags || '',
              custom_props: [],
              dependency: '',
              primary_grain: item.primary_grain || '',
              secondary_grain: item.secondary_grain || '',
              tertiary_grain: item.tertiary_grain || '',
              sa_id: item.sa_id || '',
              update_strategy_: 'I',
              ns: item.namespace_name || '',
              sa: item.subjectarea_name || '',
              ns_type: 'staging',
            };
          } else {
            // For edited records, send all required fields plus changed fields
            const originalRow = tableData.find(row => row.id === item.id);
            let hasChanges = false;
            
            if (originalRow) {
              if (item.name !== originalRow.name ||
                  item.type !== originalRow.type ||
                  item.subtype !== originalRow.subtype ||
                  item.description !== originalRow.description ||
                  item.is_delta_bool !== originalRow.is_delta_bool ||
                  item.primary_grain !== originalRow.primary_grain ||
                  item.secondary_grain !== originalRow.secondary_grain ||
                  item.tertiary_grain !== originalRow.tertiary_grain ||
                  item.runtime !== originalRow.runtime ||
                  item.sa_id !== originalRow.sa_id ||
                  item.ns_id !== originalRow.ns_id) {
                hasChanges = true;
              }
            }
            
            // Only return if there are actual changes
            if (!hasChanges) return null;
            
            return {
              type: item.type || '',
              subtype: item.subtype || '',
              name: item.name || '',
              description: item.description || '',
              is_delta: Boolean(item.is_delta_bool),
              runtime: item.runtime || '',
              tags: item.tags || '',
              custom_props: [],
              dependency: '',
              primary_grain: item.primary_grain || '',
              secondary_grain: item.secondary_grain || '',
              tertiary_grain: item.tertiary_grain || '',
              sa_id: item.sa_id || '',
              ns: item.namespace_name || '',
              sa: item.subjectarea_name || '',
              en: item.name || '',
              ns_type: item.namespace_type || 'staging',
              update_strategy_: 'U',
            };
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      // Only proceed if there are records to save
      if (entitiesToSave.length === 0) {
        toast({
          title: "No changes",
          description: "No changes to save",
        });
        return;
      }

      await entityAPI.create(entitiesToSave);
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
          <h1 className="text-2xl font-bold text-foreground">Entity Management</h1>
          <p className="text-muted-foreground">
            Manage data structures and their metadata within subject areas
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading entities...</div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Entity Management</h1>
          <p className="text-muted-foreground">
            Manage data structures and their metadata within subject areas
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-destructive">
            Error loading entities: {error.message}
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
            <BreadcrumbPage>Entity</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Entity Management</h1>
        <p className="text-muted-foreground">
          Manage data structures and their metadata within subject areas
        </p>
      </div>

      {/* Data Table with GraphQL Integration */}
      <DataTable
        columns={columnsWithRender}
        data={tableData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSave={handleSave}
        entityType="Entity"
        externalEditedData={editedData}
        onEditedDataChange={setEditedData}
      />
    </div>
  );
}