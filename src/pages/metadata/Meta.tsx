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

import { useState, useEffect } from "react";
import { useQuery } from '@apollo/client/react/hooks';
import { Upload } from "lucide-react";
import { DataTable, Column, TableData } from "@/components/table/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { useToast } from "@/hooks/use-toast";
import { FileUploadModal } from "@/components/meta/FileUploadModal";
import { GroupedNamespaceSelect } from "@/components/table/GroupedNamespaceSelect";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";


/**
 * Column configuration for the meta fields table
 * Defines the structure and display properties for each column
 */
const metaColumns: Column[] = [
  { key: 'name', title: 'name', type: 'text' },
  { key: 'alias', title: 'alias', type: 'text' },
  { key: 'description', title: 'description', type: 'text' },
  { key: 'type', title: 'type', type: 'text' },
  { key: 'subtype', title: 'subtype', type: 'text' },
  { key: 'is_primary_grain', title: 'is_primary_grain', type: 'checkbox' },
  { key: 'is_secondary_grain', title: 'is_secondary_grain', type: 'checkbox' },
  { key: 'is_tertiary_grain', title: 'is_tertiary_grain', type: 'checkbox' },
  { key: 'default', title: 'default', type: 'text' },
  { key: 'nullable', title: 'nullable', type: 'checkbox' },
  { key: 'order', title: 'order', type: 'number' },
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
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editedData, setEditedData] = useState<TableData[]>([]);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  // Wrapper function to properly handle refresh
  const handleRefresh = async () => {
    if (selectedEntity) {
      await refetch();
    }
  };

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
   * Transform GraphQL meta data to draft format (not persisted yet)
   * This matches the Glossary meta behavior where server data is loaded as draft
   */
  const draftMetaFields: TableData[] = metaData?.meta_meta.map((field, index) => {
    return {
      id: `draft_${field.id}_${index}`,
      name: field.name,
      alias: field.alias || '',
      description: field.description || '',
      type: field.type,
      subtype: field.subtype || '',
      is_primary_grain: field.is_primary_grain || false,
      is_secondary_grain: field.is_secondary_grain || false,
      is_tertiary_grain: field.is_tertiary_grain || false,
      default: field.default || '',
      nullable: field.nullable || false,
      order: field.order || 0,
      _status: 'draft',
      _originalId: field.id, // Store original ID for updates
    };
  }) || [];

  // Populate editedData with draft fields when meta data changes or entity changes
  useEffect(() => {
    if (metaData && draftMetaFields.length > 0) {
      setEditedData(draftMetaFields);
    } else if (!metaData || metaData.meta_meta.length === 0) {
      setEditedData([]);
    }
  }, [metaData, selectedEntity]);

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
    setEditedData([]); // Clear draft rows when entity changes
  };



  /**
   * Handle deleting meta fields
   * Works with both draft and persisted rows
   */
  const handleDelete = async (ids: string[]) => {
    setIsDeleting(true);
    try {
      // Filter out draft rows (not yet persisted) and actual IDs to delete from server
      const idsToDeleteFromServer = ids
        .map(id => {
          const row = editedData.find(r => r.id === id);
          if (row && row._originalId) {
            // This is a draft row with an original ID - delete the original
            return row._originalId;
          } else if (!id.startsWith('draft_')) {
            // This is a persisted row ID
            return id;
          }
          return null;
        })
        .filter((id): id is string => id !== null);

      // Delete from server if there are persisted rows to delete
      if (idsToDeleteFromServer.length > 0) {
        await metaAPI.delete(idsToDeleteFromServer);
      }

      // Remove deleted rows from editedData
      setEditedData(prev => prev.filter(row => !ids.includes(row.id)));

      // Refetch to get fresh data
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
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Handle saving draft meta fields (matches Glossary meta behavior)
   * Processes all draft rows and persists them to the server
   */
  const handleSaveDraftMeta = async (data: TableData[]) => {
    if (!selectedEntity) {
      toast({
        title: "Error",
        description: "Please select an entity first",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
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

      // Process all rows with draft status (includes edited rows from server)
      const metaFields = data
        .filter(item => item._status === 'draft')
        .map(item => ({
          id: item._originalId || crypto.randomUUID(),
          type: item.type || '',
          subtype: item.subtype || '',
          name: item.name || '',
          description: item.description || '',
          order: Number(item.order) || 0,
          alias: item.alias || '',
          length: 0,
          default: item.default || '',
          nullable: Boolean(item.nullable),
          format: '',
          is_primary_grain: Boolean(item.is_primary_grain),
          is_secondary_grain: Boolean(item.is_secondary_grain),
          is_tertiary_grain: Boolean(item.is_tertiary_grain),
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
            ns_id: selectedNamespace,
            sa_id: selectedEntityData.sa_id,
            en_id: selectedEntity,
          },
        }));

      if (metaFields.length === 0) {
        toast({
          title: "No changes",
          description: "No changes to save",
        });
        return;
      }

      await entityAPI.createWithMeta(entityData, metaFields);

      // Clear edited data and refetch to get fresh data as draft
      setEditedData([]);
      await refetch();
      
      toast({
        title: "Success",
        description: `${metaFields.length} meta field(s) saved successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save meta fields: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Get the selected entity name for display
   */
  const selectedEntityName = availableEntities.find(e => e.id === selectedEntity)?.name || '';
  const selectedEntityData = availableEntities.find(e => e.id === selectedEntity);
  
  /**
   * Check if meta exists for the selected entity
   */
  const hasExistingMeta = draftMetaFields.length > 0;

  /**
   * Handle file upload success
   * Populates draft rows when "Create Meta" and "Load Data" are unchecked
   */
  const handleUploadSuccess = (draftRows?: any) => {
    if (draftRows && draftRows.return_data) {
      // Meta fields are in return_data[1] (return_data[0] is entity data)
      const metaFields = draftRows.return_data[1];
      
      if (metaFields && Array.isArray(metaFields) && metaFields.length > 0) {
        // Convert server response to table data format with draft status
        const formattedDraftRows: TableData[] = metaFields.map((row: any, index: number) => ({
          id: `draft_${Date.now()}_${index}`,
          name: row.name || '',
          alias: row.alias || '',
          description: row.description || '',
          type: row.type || '',
          subtype: row.subtype || '',
          is_primary_grain: row.is_primary_grain || false,
          is_secondary_grain: row.is_secondary_grain || false,
          is_tertiary_grain: row.is_tertiary_grain || false,
          default: row.default || '',
          nullable: row.nullable || false,
          order: row.order || index,
          _status: 'draft',
        }));
        // Set as edited data (draft rows)
        setEditedData(formattedDraftRows);
      }
    } else {
      // If data was persisted, refetch from server
      refetch();
    }
  };

  return (
    <div className="stack-lg">
      {/* Page Header */}
      <div className="stack-xs">
        <h1 className="text-heading-lg">Meta Data Management</h1>
        <p className="text-muted">
          Explore field-level metadata for entities within your data landscape
        </p>
      </div>

      {/* Cascading Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {/* Namespace Dropdown - Grouped by Type */}
        <div className="stack-sm">
          <Label htmlFor="namespace">NameSpace</Label>
          <GroupedNamespaceSelect
            namespaces={namespacesData?.meta_namespace || []}
            value={selectedNamespace}
            onChange={handleNamespaceChange}
            placeholder="Select namespace..."
          />
        </div>

        {/* Subject Area Dropdown */}
        <div className="stack-sm">
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
        <div className="stack-sm">
          <Label htmlFor="entity">Entity</Label>
          <div className="flex-start gap-sm">
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
            
            {/* File Upload Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setUploadModalOpen(true)}
                      disabled={!selectedEntity || hasExistingMeta}
                    >
                      <Upload className="icon-sm" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {!selectedEntity 
                    ? "Select an entity first"
                    : hasExistingMeta 
                    ? "Meta already exists - File Upload Disabled"
                    : "Upload CSV to auto-detect meta fields"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* File Upload Modal */}
      {selectedEntityData && (
        <FileUploadModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          namespace={selectedEntityData.subjectarea.namespace.name}
          subjectArea={selectedEntityData.subjectarea.name}
          entity={selectedEntityData.name}
          namespaceType={selectedEntityData.subjectarea.namespace.type}
          primaryGrain={selectedEntityData.primary_grain || ''}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Entity Meta Table */}
      {selectedEntity && (
        <div className="stack-md">
          <div className="border-t pt-6 stack-sm">
            <h2 className="text-heading-md">
              Entity Metadata: {selectedEntityName}
            </h2>
            <p className="text-muted">
              Field-level metadata and business rules for the selected entity
            </p>
          </div>

          {metaLoading ? (
            <div className="flex-center py-12">
              <div className="text-muted">Loading metadata...</div>
            </div>
          ) : metaError ? (
            <div className="flex-center py-12">
              <div className="text-destructive">
                Error loading metadata: {metaError.message}
              </div>
            </div>
          ) : editedData.length > 0 ? (
            <DataTable
              columns={metaColumns}
              data={[]}
              onDelete={handleDelete}
              onSave={handleSaveDraftMeta}
              onRefresh={handleRefresh}
              entityType="Metadata"
              externalEditedData={editedData}
              onEditedDataChange={setEditedData}
              isDeleting={isDeleting}
              isSaving={isSaving}
            />
          ) : (
            <div className="flex-center py-12">
              <p className="text-muted">No metadata found for this entity</p>
            </div>
          )}
        </div>
      )}

      {/* Helper Messages */}
      {!selectedEntity && selectedSubjectArea && (
        <div className="flex-center py-12">
          <p className="text-muted">Please select an entity to view its metadata</p>
        </div>
      )}

      {!selectedSubjectArea && selectedNamespace && (
        <div className="flex-center py-12">
          <p className="text-muted">Please select a subject area to continue</p>
        </div>
      )}

      {!selectedNamespace && (
        <div className="flex-center py-12">
          <p className="text-muted">Please select a namespace to begin exploring metadata</p>
        </div>
      )}
    </div>
  );
}