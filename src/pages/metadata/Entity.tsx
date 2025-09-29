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
import { useQuery } from '@apollo/client';
import { DataTable, Column, TableData } from "@/components/table/DataTable";
import { GET_ENTITIES, GET_NAMESPACES, GET_SUBJECTAREAS, type GetEntitiesResponse, type GetNamespacesResponse, type GetSubjectAreasResponse } from "@/graphql/queries";
import { entityAPI } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { GroupedNamespaceSelect } from "@/components/table/GroupedNamespaceSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Column configuration for the entity table
 * Defines the structure and display properties for each column
 */
const entityColumns: Column[] = [
  { key: 'name', title: 'Entity Name', type: 'text', required: true },
  { key: 'type', title: 'Type', type: 'text', required: true },
  { key: 'subtype', title: 'Subtype', type: 'text' },
  { key: 'description', title: 'Description', type: 'text' },
  { key: 'subjectarea_display', title: 'Subject Area', type: 'text', required: true },
  { key: 'namespace_display', title: 'NameSpace', type: 'text', required: true },
  { key: 'is_delta', title: 'Delta Enabled', type: 'text' },
  { key: 'primary_grain', title: 'Primary Grain', type: 'text' },
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
      is_delta: entity.is_delta ? 'Yes' : 'No',
      primary_grain: entity.primary_grain || '',
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
          return <span>{row.namespace_display}</span>;
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
        ...existingEntity,
        ...updatedData,
        is_delta: updatedData.is_delta === 'Yes',
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
      const entitiesToSave = data.map(item => {
        const isNewRecord = item._status === 'draft';
        
        if (isNewRecord) {
          // For new records, send all required fields
          return {
            type: item.type || '',
            subtype: item.subtype || '',
            name: item.name || '',
            description: item.description || '',
            is_delta: item.is_delta === 'Yes',
            runtime: '',
            tags: item.tags || '',
            custom_props: [],
            dependency: '',
            primary_grain: item.primary_grain || '',
            secondary_grain: '',
            tertiary_grain: '',
            sa_id: item.sa_id || '',
            update_strategy_: 'I',
            ns: item.namespace_name || '',
            sa: item.subjectarea_name || '',
            ns_type: 'staging',
          };
        } else {
          // For edited records, only send changed fields
          const originalRow = tableData.find(row => row.id === item.id);
          const changes: any = {
            id: item.id,
            update_strategy_: 'U',
          };
          
          if (originalRow) {
            if (item.name !== originalRow.name) changes.name = item.name;
            if (item.type !== originalRow.type) changes.type = item.type;
            if (item.subtype !== originalRow.subtype) changes.subtype = item.subtype;
            if (item.description !== originalRow.description) changes.description = item.description;
            if (item.is_delta !== originalRow.is_delta) changes.is_delta = item.is_delta === 'Yes';
            if (item.primary_grain !== originalRow.primary_grain) changes.primary_grain = item.primary_grain;
            if (item.sa_id !== originalRow.sa_id) {
              changes.sa_id = item.sa_id;
              changes.sa = item.subjectarea_name;
            }
            if (item.ns_id !== originalRow.ns_id) {
              changes.ns = item.namespace_name;
            }
          }
          
          return changes;
        }
      });

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