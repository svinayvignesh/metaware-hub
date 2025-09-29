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

import { useQuery } from '@apollo/client';
import { DataTable, Column, TableData } from "@/components/table/DataTable";
import { GET_ENTITIES, type GetEntitiesResponse } from "@/graphql/queries";
import { entityAPI } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

/**
 * Column configuration for the entity table
 * Defines the structure and display properties for each column
 */
const entityColumns: Column[] = [
  { key: 'name', title: 'Entity Name', type: 'text' },
  { key: 'type', title: 'Type', type: 'text' },
  { key: 'subtype', title: 'Subtype', type: 'text' },
  { key: 'description', title: 'Description', type: 'text' },
  { key: 'subjectarea_name', title: 'Subject Area', type: 'text' },
  { key: 'namespace_name', title: 'NameSpace', type: 'text' },
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
  
  /**
   * GraphQL query to fetch all entities with nested subject area and namespace data
   * Handles loading states, errors, and data updates automatically
   */
  const { data, loading, error, refetch } = useQuery<GetEntitiesResponse>(GET_ENTITIES);

  /**
   * Transform GraphQL data to table format
   * Converts the entity data structure to match DataTable requirements
   * and flattens nested relationship information
   */
  const tableData: TableData[] = data?.meta_entity.map(entity => ({
    id: entity.id,
    name: entity.name,
    type: entity.type,
    subtype: entity.subtype || '',
    description: entity.description || '',
    subjectarea_name: entity.subjectarea.name,
    namespace_name: entity.subjectarea.namespace.name,
    is_delta: entity.is_delta ? 'Yes' : 'No',
    primary_grain: entity.primary_grain || '',
    // Store original IDs for mutations
    sa_id: entity.sa_id,
  })) || [];


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
      const entitiesToSave = data.map(item => ({
        id: item.id.startsWith('new_') ? item.name || `en_${Date.now()}` : item.id,
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
        update_strategy_: item._status === 'draft' ? 'I' : 'U',
        ns: item.namespace_name || '',
        sa: item.subjectarea_name || '',
        ns_type: 'staging',
      }));

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
        columns={entityColumns}
        data={tableData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSave={handleSave}
        entityType="Entity"
      />
    </div>
  );
}