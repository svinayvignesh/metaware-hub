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
   * Handle adding new entity
   * TODO: Implement GraphQL mutation for creating entities
   * 
   * @param newRow - Partial data for the new entity
   */
  const handleAdd = (newRow: Partial<TableData>) => {
    console.log('Add entity:', newRow);
    // TODO: Implement CREATE_ENTITY mutation
    // Example:
    // await createEntity({ variables: { input: newRow } });
    // refetch(); // Refresh data after successful creation
  };

  /**
   * Handle editing existing entity
   * TODO: Implement GraphQL mutation for updating entities
   * 
   * @param id - Unique identifier of the entity to edit
   * @param updatedData - Updated field values
   */
  const handleEdit = (id: string, updatedData: Partial<TableData>) => {
    console.log('Edit entity:', id, updatedData);
    // TODO: Implement UPDATE_ENTITY mutation
    // Example:
    // await updateEntity({ variables: { id, input: updatedData } });
    // refetch(); // Refresh data after successful update
  };

  /**
   * Handle deleting entities
   * TODO: Implement GraphQL mutation for deleting entities
   * 
   * @param ids - Array of entity IDs to delete
   */
  const handleDelete = (ids: string[]) => {
    console.log('Delete entities:', ids);
    // TODO: Implement DELETE_ENTITY mutation
    // Example:
    // await deleteEntities({ variables: { ids } });
    // refetch(); // Refresh data after successful deletion
  };

  /**
   * Handle bulk save operations
   * TODO: Implement GraphQL mutation for batch updates
   * 
   * @param data - Array of entity data to save
   */
  const handleSave = (data: TableData[]) => {
    console.log('Save entities:', data);
    // TODO: Implement batch update mutation
    // Example:
    // await batchUpdateEntities({ variables: { input: data } });
    // refetch(); // Refresh data after successful save
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
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSave={handleSave}
        entityType="Entity"
      />
    </div>
  );
}