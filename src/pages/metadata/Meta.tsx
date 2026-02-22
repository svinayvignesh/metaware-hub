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
import { Upload, FileCode } from "lucide-react";
import { DataTable, Column, TableData } from "@/components/table/DataTable";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  type GetMetaForEntityResponse,
} from "@/graphql/queries";
import { entityAPI, metaAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { FileUploadModal } from "@/components/meta/FileUploadModal";
import { GlossaryEntityDropdown } from "@/components/glossary/GlossaryEntityDropdown";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";


/**
 * Column configuration for the meta fields table
 * Defines the structure and display properties for each column
 */
const metaColumns: Column[] = [
  { key: 'name', title: 'Name', type: 'text', required: true },
  { key: 'type', title: 'Type', type: 'text', required: true },
  { key: 'order', title: 'Order', type: 'number', required: true },
  { key: 'alias', title: 'Alias', type: 'text' },
  { key: 'description', title: 'Description', type: 'text' },
  { key: 'subtype', title: 'Subtype', type: 'text' },
  { key: 'is_primary_grain', title: 'Primary Grain', type: 'checkbox' },
  { key: 'is_secondary_grain', title: 'Secondary Grain', type: 'checkbox' },
  { key: 'is_tertiary_grain', title: 'Tertiary Grain', type: 'checkbox' },
  { key: 'default', title: 'Default', type: 'text' },
  { key: 'nullable', title: 'Nullable', type: 'checkbox' },
];

/**
 * Meta Data Management Component
 * 
 * Renders the cascading dropdown interface and meta fields table
 * with real-time data from the GraphQL API.
 */
export default function Meta() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editedData, setEditedData] = useState<TableData[]>([]);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  // GraphQL queries for dropdown data
  const { data: namespacesData } = useQuery<GetNamespacesResponse>(GET_NAMESPACES);
  const { data: subjectAreasData } = useQuery<GetSubjectAreasResponse>(GET_SUBJECTAREAS);
  const { data: entitiesData } = useQuery<GetEntitiesResponse>(GET_ENTITIES);

  // GraphQL query for meta fields (only when entity is selected)
  const { data: metaData, loading: metaLoading, error: metaError, refetch } = useQuery<GetMetaForEntityResponse>(
    GET_META_FOR_ENTITY,
    {
      variables: { enid: selectedEntityId },
      skip: !selectedEntityId, // Skip query if no entity is selected
    }
  );

  // Wrapper function to properly handle refresh
  const handleRefresh = async () => {
    if (selectedEntityId) {
      await refetch();
    }
  };



  /**
   * Transform GraphQL meta data to table format
   * Server data is loaded as regular rows, not draft
   */
  const existingMetaFields: TableData[] = metaData?.meta_meta.map((field) => {
    return {
      id: field.id,
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
    };
  }) || [];

  /**
   * Handle entity selection from cascading dropdown
   */
  const handleEntitySelect = (entity: any) => {
    setSelectedEntityId(entity.id);
    setEditedData([]); // Clear draft rows when entity changes
  };



  /**
   * Handle deleting meta fields using /mwn/delete endpoint
   */
  const handleDelete = async (ids: string[]) => {
    setIsDeleting(true);
    try {
      // Separate draft IDs (new, unsaved) from persisted IDs
      const draftIds = ids.filter(id => id.startsWith('draft_'));
      const persistedIds = ids.filter(id => !id.startsWith('draft_'));

      // Delete persisted rows from server
      if (persistedIds.length > 0) {
        await metaAPI.delete(persistedIds);
      }

      // Remove draft rows from editedData (they're only in memory)
      if (draftIds.length > 0) {
        setEditedData(prev => prev.filter(row => !draftIds.includes(row.id)));
      }

      toast({
        title: "Success",
        description: `${ids.length} meta field(s) deleted successfully`,
      });

      // Always refetch to get fresh data from server
      await refetch();
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
   * Handle saving draft meta fields
   * Only processes rows with draft status and persists them
   */
  const handleSaveDraftMeta = async (data: TableData[]) => {
    if (!selectedEntityId) {
      toast({
        title: "Error",
        description: "Please select an entity first",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const selectedEntityData = entitiesData?.meta_entity.find(e => e.id === selectedEntityId);
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
        ns: selectedEntityData.subjectarea?.namespace?.name || '',
        sa: selectedEntityData.subjectarea?.name || '',
        ns_type: 'staging',
      };

      // Process draft rows (new) and edited rows (modified existing)
      const changedRows = data.filter(item => item._status === 'draft' || item._status === 'edited');

      if (changedRows.length === 0) {
        toast({
          title: "No changes",
          description: "No changes to save",
        });
        return;
      }

      const metaFields = changedRows.map(item => ({
        id: item.id.startsWith('draft_') ? crypto.randomUUID() : item.id,
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
        entity_id: selectedEntityId,
        ns: selectedEntityData.subjectarea?.namespace?.name || '',
        sa: selectedEntityData.subjectarea?.name || '',
        en: selectedEntityData.name,
        entity_core: {
          ns: selectedEntityData.subjectarea?.namespace?.name || '',
          sa: selectedEntityData.subjectarea?.name || '',
          en: selectedEntityData.name,
          ns_type: 'staging',
          ns_id: selectedEntityData.subjectarea?.namespace?.id || '',
          sa_id: selectedEntityData.sa_id,
          en_id: selectedEntityId,
        },
      }));

      await entityAPI.createWithMeta(entityData, metaFields);

      // Clear edited data and refetch
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
   * Get the selected entity data
   */
  const selectedEntityData = entitiesData?.meta_entity.find(e => e.id === selectedEntityId);

  /**
   * Check if meta exists for the selected entity
   */
  const hasExistingMeta = existingMetaFields.length > 0;

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 pb-4">
        <div>
          <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-2xl shadow-primary/5 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                    <FileCode className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground tracking-tight">Meta Data Management</h1>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">Explore field-level metadata for entities within your data landscape</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedEntityData && (
                  <Badge variant="secondary" className="font-mono text-xs px-3 py-1 rounded-full">
                    {selectedEntityData.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-8 px-4">
        {/* Entity Selection with Cascading Dropdown - All Types */}
        <div className="space-y-4">
          <Label>Select Entity (All Types)</Label>
          <GlossaryEntityDropdown
            value={selectedEntityId}
            onSelect={handleEntitySelect}
            namespaceTypes={["staging", "glossary", "model", "reference"]} // Show all types
            placeholder="Select entity from any namespace type..."
          />
        </div>

        {/* File Upload Card - Shown when entity selected and no meta exists */}
        {selectedEntityId && !hasExistingMeta && (
          <Card className="rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 mt-4">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-3 shadow-lg shadow-primary/30">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold">
                    {selectedEntityData?.subtype === 'view' ? 'Quick Start: Create Meta' : 'Quick Start: Upload CSV'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedEntityData?.subtype === 'view'
                      ? `Derive meta fields from a source entity or upload a CSV for ${selectedEntityData?.name || 'this entity'}`
                      : `Upload a CSV file to automatically detect and create meta fields for ${selectedEntityData?.name || 'this entity'}`
                    }
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <Button
                      onClick={() => setUploadModalOpen(true)}
                      className="rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload CSV File
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Upload Modal */}
        {selectedEntityData && (
          <FileUploadModal
            open={uploadModalOpen}
            onOpenChange={setUploadModalOpen}
            namespace={selectedEntityData.subjectarea?.namespace?.name || ''}
            subjectArea={selectedEntityData.subjectarea?.name || ''}
            entity={selectedEntityData.name}
            entityDescription={selectedEntityData.description || ''}
            namespaceType={selectedEntityData.subjectarea?.namespace?.type || 'unknown'}
            primaryGrain={selectedEntityData.primary_grain || ''}
            subtype={selectedEntityData.subtype || ''}
            onSuccess={handleUploadSuccess}
          />
        )}

        {/* Entity Meta Table */}
        {selectedEntityId && (
          <div className="mt-8 space-y-4">
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold">
                Entity Metadata: {selectedEntityData?.name || ''}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
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
            ) : (
              <DataTable
                columns={metaColumns}
                data={existingMetaFields}
                onDelete={handleDelete}
                onSave={handleSaveDraftMeta}
                onRefresh={handleRefresh}
                entityType="Metadata"
                externalEditedData={editedData}
                onEditedDataChange={setEditedData}
                isDeleting={isDeleting}
                isSaving={isSaving}
              />
            )}
          </div>
        )}

        {/* Helper Messages */}
        {!selectedEntityId && (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Please select an entity to view its metadata</p>
          </div>
        )}
      </div>
    </div>
  );
}