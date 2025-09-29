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
import { entityAPI, metaAPI } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

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
   * Group namespaces by type for organized dropdown display
   */
  const groupedNamespaces = namespacesData?.meta_namespace.reduce((groups, namespace) => {
    const type = namespace.type || 'Other';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(namespace);
    return groups;
  }, {} as Record<string, typeof namespacesData.meta_namespace>) || {};

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
   * Handle adding new meta field
   */
  const handleAdd = async (newRow: Partial<TableData>) => {
    if (!selectedEntity) {
      toast({
        title: "Error",
        description: "Please select an entity first",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedEntityData = availableEntities.find(e => e.id === selectedEntity);
      if (!selectedEntityData) return;

      const entityData = {
        id: selectedEntityData.id,
        type: selectedEntityData.type,
        subtype: selectedEntityData.subtype || '',
        name: selectedEntityData.name,
        description: selectedEntityData.description || '',
        is_delta: selectedEntityData.is_delta || false,
        runtime: '',
        tags: '',
        custom_props: [],
        dependency: '',
        primary_grain: selectedEntityData.primary_grain || '',
        secondary_grain: '',
        tertiary_grain: '',
        sa_id: selectedEntityData.sa_id,
        update_strategy_: 'U',
        ns: selectedEntityData.subjectarea.namespace.name,
        sa: selectedEntityData.subjectarea.name,
        ns_type: 'staging',
      };

      const metaField = {
        id: newRow.id || '',
        type: newRow.type || '',
        subtype: '',
        name: newRow.name || '',
        description: newRow.description || '',
        order: Number(newRow.order) || 0,
        alias: newRow.alias || '',
        length: 0,
        default: newRow.default || '',
        nullable: newRow.nullable === 'Yes',
        format: '',
        is_primary_grain: newRow.grain_info?.includes('Primary') || false,
        is_secondary_grain: newRow.grain_info?.includes('Secondary') || false,
        is_tertiary_grain: newRow.grain_info?.includes('Tertiary') || false,
        tags: '',
        custom_props: [],
        entity_id: selectedEntity,
        ns: selectedEntityData.subjectarea.namespace.name,
        sa: selectedEntityData.subjectarea.name,
        en: selectedEntityData.name,
        entity_core: {
          ns: selectedEntityData.subjectarea.namespace.name,
          sa: selectedEntityData.subjectarea.name,
          en: selectedEntityData.name,
          ns_type: 'staging',
          ns_id: selectedNamespace, // Use the selected namespace ID
          sa_id: selectedEntityData.sa_id,
          en_id: selectedEntityData.id,
        },
      };

      await entityAPI.createWithMeta(entityData, [metaField]);
      await refetch();
      toast({
        title: "Success",
        description: "Meta field created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create meta field: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (id: string, updatedData: Partial<TableData>) => {
    console.log('Edit meta field:', id, updatedData);
    // Note: API doesn't provide update for individual meta fields
    // Would need to update entire entity with meta fields
    toast({
      title: "Info", 
      description: "Meta field updates not yet supported via API",
    });
  };

  const handleDelete = async (ids: string[]) => {
    try {
      await metaAPI.delete(ids);
      await refetch();
      toast({
        title: "Success",
        description: `${ids.length} meta field(s) deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete meta fields: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleSave = async (data: TableData[]) => {
    if (!selectedEntity) {
      toast({
        title: "Error", 
        description: "Please select an entity first",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedEntityData = availableEntities.find(e => e.id === selectedEntity);
      if (!selectedEntityData) return;

      const entityData = {
        id: selectedEntityData.id,
        type: selectedEntityData.type,
        subtype: selectedEntityData.subtype || '',
        name: selectedEntityData.name,
        description: selectedEntityData.description || '',
        is_delta: selectedEntityData.is_delta || false,
        runtime: '',
        tags: '',
        custom_props: [],
        dependency: '',
        primary_grain: selectedEntityData.primary_grain || '',
        secondary_grain: '',
        tertiary_grain: '',
        sa_id: selectedEntityData.sa_id,
        update_strategy_: 'U',
        ns: selectedEntityData.subjectarea.namespace.name,
        sa: selectedEntityData.subjectarea.name,
        ns_type: 'staging',
      };

      const metaFields = data
        .map(item => {
          const isNewRecord = item._status === 'draft';
          
          if (isNewRecord) {
            // For new records, include all fields
            return {
              id: `meta_${Date.now()}_${Math.random()}`,
              type: item.type || '',
              subtype: '',
              name: item.name || '',
              description: item.description || '',
              order: Number(item.order) || 0,
              alias: item.alias || '',
              length: 0,
              default: item.default || '',
              nullable: item.nullable === 'Yes',
              format: '',
              is_primary_grain: item.grain_info?.includes('Primary') || false,
              is_secondary_grain: item.grain_info?.includes('Secondary') || false,
              is_tertiary_grain: item.grain_info?.includes('Tertiary') || false,
              tags: '',
              custom_props: [],
              entity_id: selectedEntity,
              ns: selectedEntityData.subjectarea.namespace.name,
              sa: selectedEntityData.subjectarea.name,
              en: selectedEntityData.name,
              entity_core: {
                ns: selectedEntityData.subjectarea.namespace.name,
                sa: selectedEntityData.subjectarea.name,
                en: selectedEntityData.name,
                ns_type: 'staging',
                ns_id: '',
                sa_id: selectedEntityData.sa_id,
                en_id: selectedEntity,
              }
            };
          } else {
            // For edited records, check for actual changes
            const originalRow = tableData.find(row => row.id === item.id);
            if (!originalRow) return null;
            
            let hasChanges = false;
            if (
              item.name !== originalRow.name ||
              item.type !== originalRow.type ||
              item.nullable !== originalRow.nullable ||
              item.default !== originalRow.default ||
              item.description !== originalRow.description ||
              item.alias !== originalRow.alias ||
              item.order !== originalRow.order ||
              item.grain_info !== originalRow.grain_info
            ) {
              hasChanges = true;
            }
            
            // Only return if there are actual changes
            if (!hasChanges) return null;
            
            return {
              id: item.id,
              type: item.type || '',
              subtype: '',
              name: item.name || '',
              description: item.description || '',
              order: Number(item.order) || 0,
              alias: item.alias || '',
              length: 0,
              default: item.default || '',
              nullable: item.nullable === 'Yes',
              format: '',
              is_primary_grain: item.grain_info?.includes('Primary') || false,
              is_secondary_grain: item.grain_info?.includes('Secondary') || false,
              is_tertiary_grain: item.grain_info?.includes('Tertiary') || false,
              tags: '',
              custom_props: [],
              entity_id: selectedEntity,
              ns: selectedEntityData.subjectarea.namespace.name,
              sa: selectedEntityData.subjectarea.name,
              en: selectedEntityData.name,
              entity_core: {
                ns: selectedEntityData.subjectarea.namespace.name,
                sa: selectedEntityData.subjectarea.namespace.name,
                en: selectedEntityData.name,
                ns_type: 'staging',
                ns_id: '',
                sa_id: selectedEntityData.sa_id,
                en_id: selectedEntity,
              }
            };
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      // Only proceed if there are meta fields to save
      if (metaFields.length === 0) {
        toast({
          title: "No changes",
          description: "No changes to save",
        });
        return;
      }

      await entityAPI.createWithMeta(entityData, metaFields);
      
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
        {/* Namespace Dropdown - Grouped by Type */}
        <div className="space-y-2">
          <Label htmlFor="namespace">NameSpace</Label>
          <Select onValueChange={handleNamespaceChange} value={selectedNamespace}>
            <SelectTrigger>
              <SelectValue placeholder="Select namespace..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(groupedNamespaces).map(([type, namespaces]) => (
                <div key={type}>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                    {type}
                  </div>
                  {namespaces.map((namespace) => (
                    <SelectItem key={namespace.id} value={namespace.id} className="pl-6">
                      {namespace.name}
                    </SelectItem>
                  ))}
                </div>
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
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSave={handleSave}
              entityType="Metadata"
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