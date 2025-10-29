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
import { 
  GET_NAMESPACES, 
  GET_SUBJECTAREAS, 
  GET_ENTITIES,
  type GetNamespacesResponse,
  type GetSubjectAreasResponse,
  type GetEntitiesResponse
} from "@/graphql/queries";

export default function PrepareFiles() {
  const [activeTab, setActiveTab] = useState("meta");
  
  // Meta Upload State
  const [metaUploadModalOpen, setMetaUploadModalOpen] = useState(false);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [selectedSubjectArea, setSelectedSubjectArea] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<string>('');

  // Glossary Import State
  const [glossaryImportModalOpen, setGlossaryImportModalOpen] = useState(false);

  // GraphQL queries
  const { data: namespacesData } = useQuery<GetNamespacesResponse>(GET_NAMESPACES);
  const { data: subjectAreasData } = useQuery<GetSubjectAreasResponse>(GET_SUBJECTAREAS);
  const { data: entitiesData } = useQuery<GetEntitiesResponse>(GET_ENTITIES);

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

  const handleMetaUploadSuccess = () => {
    // Reset form after successful upload
    setSelectedNamespace('');
    setSelectedSubjectArea('');
    setSelectedEntity('');
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
                  <Select 
                    value={selectedEntity} 
                    onValueChange={setSelectedEntity}
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
                </div>

                <div className="prepare-files-info">
                  <strong>Information:</strong>
                  <ul className="prepare-files-info-list">
                    <li>Upload CSV files to auto-detect metadata structure</li>
                    <li>Choose to create metadata and/or load data</li>
                    <li>Primary grain field detection available</li>
                  </ul>
                </div>

                <div className="prepare-files-actions">
                  <Button
                    onClick={() => setMetaUploadModalOpen(true)}
                    disabled={!selectedEntity}
                  >
                    <Upload className="prepare-files-upload-icon" />
                    Upload File
                  </Button>
                </div>
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
