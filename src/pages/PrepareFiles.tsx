import { useState } from "react";
import { useQuery } from '@apollo/client/react/hooks';
import { Upload, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { FileUploadModal } from "@/components/meta/FileUploadModal";
import { ImportConfigModal } from "@/components/glossary/ImportConfigModal";
import { GroupedNamespaceSelect } from "@/components/table/GroupedNamespaceSelect";
import { DataTable, Column, TableData } from "@/components/table/DataTable";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

export default function PrepareFiles() {
  const [activeTab, setActiveTab] = useState("meta");
  
  // Meta Upload State
  const [metaUploadModalOpen, setMetaUploadModalOpen] = useState(false);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [selectedSubjectArea, setSelectedSubjectArea] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [editedData, setEditedData] = useState<TableData[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Glossary Import State
  const [glossaryImportModalOpen, setGlossaryImportModalOpen] = useState(false);

  // GraphQL queries
  const { data: namespacesData } = useQuery<GetNamespacesResponse>(GET_NAMESPACES);
  const { data: subjectAreasData } = useQuery<GetSubjectAreasResponse>(GET_SUBJECTAREAS);
  const { data: entitiesData } = useQuery<GetEntitiesResponse>(GET_ENTITIES);
  
  // Query meta fields when entity is selected
  const { data: metaData, loading: metaLoading, refetch } = useQuery<GetMetaForEntityResponse>(
    GET_META_FOR_ENTITY,
    {
      variables: { enid: selectedEntity },
      skip: !selectedEntity,
    }
  );

  // Filter data based on selections
  const availableSubjectAreas = subjectAreasData?.meta_subjectarea.filter(
    area => area.ns_id === selectedNamespace
  ) || [];

  const availableEntities = entitiesData?.meta_entity.filter(
    entity => entity.sa_id === selectedSubjectArea
  ) || [];

  const selectedEntityData = availableEntities.find(e => e.id === selectedEntity);
  const selectedNamespaceData = namespacesData?.meta_namespace.find(n => n.id === selectedNamespace);

  const handleNamespaceChange = (value: string) => {
    setSelectedNamespace(value);
    setSelectedSubjectArea('');
    setSelectedEntity('');
  };

  const handleSubjectAreaChange = (value: string) => {
    setSelectedSubjectArea(value);
    setSelectedEntity('');
  };

  const handleEntityChange = (value: string) => {
    setSelectedEntity(value);
    setEditedData([]);
  };

  // Transform meta data to table format
  const existingTableData: TableData[] = metaData?.meta_meta.map(field => ({
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
  })) || [];

  const tableData: TableData[] = existingTableData;
  const hasExistingMeta = tableData.length > 0;

  const handleMetaUploadSuccess = (draftRows?: any) => {
    if (draftRows && draftRows.return_data) {
      const metaFields = draftRows.return_data[1];
      
      if (metaFields && Array.isArray(metaFields) && metaFields.length > 0) {
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
        setEditedData([...formattedDraftRows, ...existingTableData]);
      }
    } else {
      refetch();
    }
  };

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
        subtype: newRow.subtype || '',
        name: newRow.name || '',
        description: newRow.description || '',
        order: Number(newRow.order) || 0,
        alias: newRow.alias || '',
        length: 0,
        default: newRow.default || '',
        nullable: Boolean(newRow.nullable),
        format: '',
        is_primary_grain: Boolean(newRow.is_primary_grain),
        is_secondary_grain: Boolean(newRow.is_secondary_grain),
        is_tertiary_grain: Boolean(newRow.is_tertiary_grain),
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
    toast({
      title: "Info", 
      description: "Meta field updates not yet supported via API",
    });
  };

  const handleDelete = async (ids: string[]) => {
    setIsDeleting(true);
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
    } finally {
      setIsDeleting(false);
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

    setIsSaving(true);
    try {
      const selectedEntityData = availableEntities.find(e => e.id === selectedEntity);
      if (!selectedEntityData) return;

      const entityData = {
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
            return {
              id: `meta_${Date.now()}_${Math.random()}`,
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
              }
            };
          } else {
            const originalRow = tableData.find(row => row.id === item.id);
            if (!originalRow) return null;
            
            let hasChanges = false;
            if (
              item.name !== originalRow.name ||
              item.type !== originalRow.type ||
              item.subtype !== originalRow.subtype ||
              item.nullable !== originalRow.nullable ||
              item.default !== originalRow.default ||
              item.description !== originalRow.description ||
              item.alias !== originalRow.alias ||
              item.order !== originalRow.order ||
              item.is_primary_grain !== originalRow.is_primary_grain ||
              item.is_secondary_grain !== originalRow.is_secondary_grain ||
              item.is_tertiary_grain !== originalRow.is_tertiary_grain
            ) {
              hasChanges = true;
            }
            
            if (!hasChanges) return null;
            
            return {
              id: item.id,
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
              }
            };
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (metaFields.length === 0) {
        toast({
          title: "No changes",
          description: "No changes to save",
        });
        return;
      }

      await entityAPI.createWithMeta(entityData, metaFields);
      setEditedData([]);
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
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .prepare-files-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1.5rem;
        }

        .prepare-files-breadcrumb {
          margin-bottom: 0.5rem;
        }

        .prepare-files-header {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .prepare-files-title {
          font-size: 1.875rem;
          font-weight: bold;
          line-height: 2.25rem;
          letter-spacing: -0.025em;
        }

        .prepare-files-description {
          color: hsl(var(--muted-foreground));
        }

        .prepare-files-tabs {
          width: 100%;
        }

        .prepare-files-card {
          border: 1px solid hsl(var(--border));
        }

        .prepare-files-card-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .prepare-files-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .prepare-files-label {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .prepare-files-required {
          color: hsl(var(--destructive));
        }

        .prepare-files-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 1rem;
        }

        .prepare-files-upload-icon {
          margin-right: 0.5rem;
          height: 1rem;
          width: 1rem;
        }

        .prepare-files-info {
          padding: 1rem;
          background-color: hsl(var(--muted) / 0.5);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
        }

        .prepare-files-info-list {
          margin-top: 0.5rem;
          margin-left: 1.25rem;
          list-style-type: disc;
        }

        .prepare-files-info-list li {
          margin-top: 0.25rem;
        }
      `}</style>

      <div className="prepare-files-container">
        <div className="prepare-files-breadcrumb">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Prepare Files</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="prepare-files-header">
          <h1 className="prepare-files-title">Prepare Files</h1>
          <p className="prepare-files-description">
            Upload and process files for metadata auto-detection and glossary configuration
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="prepare-files-tabs">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meta">Meta Auto-Detect</TabsTrigger>
            <TabsTrigger value="glossary">Glossary Import</TabsTrigger>
          </TabsList>

          <TabsContent value="meta">
            <Card className="prepare-files-card">
              <CardHeader>
                <CardTitle>Meta Field Auto-Detection</CardTitle>
                <CardDescription>
                  Upload a CSV file to automatically detect and create metadata fields for an entity
                </CardDescription>
              </CardHeader>
              <CardContent className="prepare-files-card-content">
                <div className="prepare-files-field">
                  <Label className="prepare-files-label">
                    Namespace <span className="prepare-files-required">*</span>
                  </Label>
                  <GroupedNamespaceSelect
                    namespaces={namespacesData?.meta_namespace || []}
                    value={selectedNamespace}
                    onChange={handleNamespaceChange}
                    placeholder="Select namespace"
                  />
                </div>

                <div className="prepare-files-field">
                  <Label className="prepare-files-label">
                    Subject Area <span className="prepare-files-required">*</span>
                  </Label>
                  <Select 
                    value={selectedSubjectArea} 
                    onValueChange={handleSubjectAreaChange}
                    disabled={!selectedNamespace}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject area" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubjectAreas.map((sa) => (
                        <SelectItem key={sa.id} value={sa.id}>
                          {sa.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="prepare-files-field">
                  <Label className="prepare-files-label">
                    Entity <span className="prepare-files-required">*</span>
                  </Label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Select 
                      value={selectedEntity} 
                      onValueChange={handleEntityChange}
                      disabled={!selectedSubjectArea}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEntities.map((entity) => (
                          <SelectItem key={entity.id} value={entity.id}>
                            {entity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setMetaUploadModalOpen(true)}
                              disabled={!selectedEntity || hasExistingMeta}
                            >
                              <Upload className="h-4 w-4" />
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

                {selectedEntity && (
                  <>
                    <div className="prepare-files-info">
                      <strong>Information:</strong>
                      <ul className="prepare-files-info-list">
                        <li>Upload CSV files to auto-detect metadata structure</li>
                        <li>Choose to create metadata and/or load data</li>
                        <li>Primary grain field detection available</li>
                        {hasExistingMeta && <li><strong>Meta fields already exist - editing available below</strong></li>}
                      </ul>
                    </div>

                    {metaLoading ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                        <div style={{ color: 'hsl(var(--muted-foreground))' }}>Loading meta fields...</div>
                      </div>
                    ) : (
                      <DataTable
                        columns={metaColumns}
                        data={tableData}
                        onAdd={handleAdd}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onSave={handleSave}
                        onRefresh={refetch}
                        entityType="Meta Field"
                        externalEditedData={editedData}
                        onEditedDataChange={setEditedData}
                        isDeleting={isDeleting}
                        isSaving={isSaving}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="glossary">
            <Card className="prepare-files-card">
              <CardHeader>
                <CardTitle>Glossary Configuration Import</CardTitle>
                <CardDescription>
                  Import glossary configuration from an Excel file
                </CardDescription>
              </CardHeader>
              <CardContent className="prepare-files-card-content">
                <div className="prepare-files-info">
                  <strong>Supported Sheet Types:</strong>
                  <ul className="prepare-files-info-list">
                    <li>Namespace</li>
                    <li>Subject Area</li>
                    <li>Meta</li>
                    <li>Entity</li>
                    <li>Rules</li>
                  </ul>
                </div>

                <div className="prepare-files-actions">
                  <Button onClick={() => setGlossaryImportModalOpen(true)}>
                    <FileSpreadsheet className="prepare-files-upload-icon" />
                    Import Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Meta Upload Modal */}
        {selectedEntityData && selectedNamespaceData && (
          <FileUploadModal
            open={metaUploadModalOpen}
            onOpenChange={setMetaUploadModalOpen}
            namespace={selectedNamespaceData.name}
            subjectArea={availableSubjectAreas.find(sa => sa.id === selectedSubjectArea)?.name || ''}
            entity={selectedEntityData.name}
            namespaceType={selectedNamespaceData.type}
            primaryGrain={selectedEntityData.primary_grain || ''}
            onSuccess={handleMetaUploadSuccess}
          />
        )}

        {/* Glossary Import Modal */}
        <ImportConfigModal
          open={glossaryImportModalOpen}
          onOpenChange={setGlossaryImportModalOpen}
        />
      </div>
    </>
  );
}
