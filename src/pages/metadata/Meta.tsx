/**
 * Meta Data Management Page
 * 
 * This component provides a specialized interface for managing field-level metadata
 * within the MetaWare metadata management system. It uses cascading dropdowns to
 * navigate the hierarchy: Namespace → Subject Area → Entity → Meta Fields.
 * 
 * Features:
 * - Cascading dropdown navigation (Namespace → Subject Area → Entity)
 * - Field-level metadata display and management
 * - CRUD operations for meta fields
 * - Real-time data synchronization with GraphQL API
 * - Hierarchical data relationships
 * 
 * @author MetaWare Development Team
 * @version 1.0.0
 */

import { useState } from "react";
import { useQuery } from '@apollo/client';
import { DataTable, Column, TableData } from "@/components/table/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  GET_NAMESPACES, 
  GET_SUBJECTAREAS, 
  GET_ENTITIES, 
  GET_META_FOR_ENTITY,
  type GetNamespacesResponse,
  type GetSubjectAreasResponse,
  type GetEntitiesResponse,
  type GetMetaForEntityResponse
} from "@/graphql/queries";

/**
 * Column configuration for the meta fields table
 * Defines the structure and display properties for each column
 */
const metaColumns: Column[] = [
  { key: 'name', title: 'Field Name', type: 'text' },
  { key: 'type', title: 'Data Type', type: 'text' },
  { key: 'nullable', title: 'Nullable', type: 'text' },
  { key: 'default', title: 'Default Value', type: 'text' },
  { key: 'description', title: 'Description', type: 'text' },
  { key: 'alias', title: 'Alias', type: 'text' },
  { key: 'order', title: 'Order', type: 'number' },
  { key: 'grain_info', title: 'Grain Level', type: 'text' },
];

/**
 * Meta Data Management Component
 * 
 * Renders the cascading dropdown interface and meta fields table
 * with real-time data from the GraphQL API.
 */
export default function Meta() {
  // State for dropdown selections
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [selectedSubjectArea, setSelectedSubjectArea] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<string>('');

  // GraphQL queries for dropdown data
  const { data: namespacesData } = useQuery<GetNamespacesResponse>(GET_NAMESPACES);
  const { data: subjectAreasData } = useQuery<GetSubjectAreasResponse>(GET_SUBJECTAREAS);
  const { data: entitiesData } = useQuery<GetEntitiesResponse>(GET_ENTITIES);
  
  // GraphQL query for meta fields (only when entity is selected)
  const { data: metaData, loading: metaLoading, error: metaError, refetch } = useQuery<GetMetaForEntityResponse>(
    GET_META_FOR_ENTITY,
    {
      variables: { enid: selectedEntity },
      skip: !selectedEntity, // Skip query if no entity is selected
    }
  );

  /**
   * Filter subject areas based on selected namespace
   */
  const availableSubjectAreas = subjectAreasData?.meta_subjectarea.filter(
    area => area.ns_id === selectedNamespace
  ) || [];

  /**
   * Filter entities based on selected subject area
   */
  const availableEntities = entitiesData?.meta_entity.filter(
    entity => entity.sa_id === selectedSubjectArea
  ) || [];

  /**
   * Transform GraphQL meta data to table format
   */
  const tableData: TableData[] = metaData?.meta_meta.map(field => {
    // Determine grain level information
    let grainInfo = '';
    if (field.is_primary_grain) grainInfo += 'Primary ';
    if (field.is_secondary_grain) grainInfo += 'Secondary ';
    if (field.is_tertiary_grain) grainInfo += 'Tertiary ';
    if (grainInfo) grainInfo += 'Grain';

    return {
      id: field.id,
      name: field.name,
      type: field.type,
      nullable: field.nullable ? 'Yes' : 'No',
      default: field.default || '',
      description: field.description || '',
      alias: field.alias || '',
      order: field.order || 0,
      grain_info: grainInfo.trim(),
    };
  }) || [];

  /**
   * Handle namespace selection change
   * Resets dependent dropdowns when namespace changes
   */
  const handleNamespaceChange = (value: string) => {
    setSelectedNamespace(value);
    setSelectedSubjectArea('');
    setSelectedEntity('');
  };

  /**
   * Handle subject area selection change
   * Resets entity dropdown when subject area changes
   */
  const handleSubjectAreaChange = (value: string) => {
    setSelectedSubjectArea(value);
    setSelectedEntity('');
  };

  /**
   * Handle entity selection change
   * Triggers meta data fetch for the selected entity
   */
  const handleEntityChange = (value: string) => {
    setSelectedEntity(value);
  };

  /**
   * Meta field CRUD operations
   * TODO: Implement GraphQL mutations for meta field management
   */
  const handleAdd = (newRow: Partial<TableData>) => {
    console.log('Add meta field:', newRow);
    // TODO: Implement CREATE_META_FIELD mutation
  };

  const handleEdit = (id: string, updatedData: Partial<TableData>) => {
    console.log('Edit meta field:', id, updatedData);
    // TODO: Implement UPDATE_META_FIELD mutation
  };

  const handleDelete = (ids: string[]) => {
    console.log('Delete meta fields:', ids);
    // TODO: Implement DELETE_META_FIELD mutation
  };

  const handleSave = (data: TableData[]) => {
    console.log('Save meta fields:', data);
    // TODO: Implement batch update mutation
    // refetch(); // Refresh data after successful save
  };

  /**
   * Get the selected entity name for display
   */
  const selectedEntityName = availableEntities.find(e => e.id === selectedEntity)?.name || '';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meta Data Management</h1>
        <p className="text-muted-foreground">
          Explore field-level metadata for entities within your data landscape
        </p>
      </div>

      {/* Cascading Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Namespace Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="namespace">NameSpace</Label>
          <Select onValueChange={handleNamespaceChange} value={selectedNamespace}>
            <SelectTrigger>
              <SelectValue placeholder="Select namespace..." />
            </SelectTrigger>
            <SelectContent>
              {namespacesData?.meta_namespace.map((namespace) => (
                <SelectItem key={namespace.id} value={namespace.id}>
                  {namespace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subject Area Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="subject-area">Subject Area</Label>
          <Select 
            onValueChange={handleSubjectAreaChange} 
            value={selectedSubjectArea}
            disabled={!selectedNamespace}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subject area..." />
            </SelectTrigger>
            <SelectContent>
              {availableSubjectAreas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entity Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="entity">Entity</Label>
          <Select 
            onValueChange={handleEntityChange} 
            value={selectedEntity}
            disabled={!selectedSubjectArea}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select entity..." />
            </SelectTrigger>
            <SelectContent>
              {availableEntities.map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Entity Meta Table */}
      {selectedEntity && (
        <div className="space-y-4">
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Entity Metadata: {selectedEntityName}
            </h2>
            <p className="text-muted-foreground mb-4">
              Field-level metadata and business rules for the selected entity
            </p>
          </div>

          {metaLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading metadata...</div>
            </div>
          ) : metaError ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-destructive">
                Error loading metadata: {metaError.message}
              </div>
            </div>
          ) : (
            <DataTable
              columns={metaColumns}
              data={tableData}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSave={handleSave}
            />
          )}
        </div>
      )}

      {/* Helper Messages */}
      {!selectedEntity && selectedSubjectArea && (
        <div className="text-center py-8 text-muted-foreground">
          Please select an entity to view its metadata
        </div>
      )}

      {!selectedSubjectArea && selectedNamespace && (
        <div className="text-center py-8 text-muted-foreground">
          Please select a subject area to continue
        </div>
      )}

      {!selectedNamespace && (
        <div className="text-center py-8 text-muted-foreground">
          Please select a namespace to begin exploring metadata
        </div>
      )}
    </div>
  );
}