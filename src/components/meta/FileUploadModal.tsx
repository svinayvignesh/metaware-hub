import { useState, useEffect } from "react";
import { X, Upload, FileText, Loader2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMDConnectionContext } from "@/contexts/MDConnectionContext";
import { queryMDTable } from "@/hooks/useMDConnection";
import { DataTable } from "@/components/table/DataTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  namespace: string;
  subjectArea: string;
  entity: string;
  entityDescription: string;
  namespaceType: string;
  primaryGrain: string;
  onSuccess: (draftRows?: any[]) => void;
}

export function FileUploadModal({
  open,
  onOpenChange,
  namespace,
  subjectArea,
  entity,
  entityDescription,
  namespaceType,
  primaryGrain,
  onSuccess,
}: FileUploadModalProps) {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [createMeta, setCreateMeta] = useState(false);
  const [loadData, setLoadData] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loadedTableData, setLoadedTableData] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const { toast } = useToast();
  const { connection, connect, ready } = useMDConnectionContext();

  // Connect to MotherDuck on mount
  useEffect(() => {
    connect();
  }, [connect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid File",
          description: "Please upload a CSV file only",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setUploadProgress(100);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadProgress(0);
  };

  const handleProcess = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const queryParams = new URLSearchParams({
        ns: namespace,
        sa: subjectArea,
        en: entity,
        description: entityDescription || '',
        ns_type: namespaceType,
        create_meta: String(createMeta),
        load_data: String(loadData),
        primary_grain: primaryGrain || '.',
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/mwn/auto_detect_staging?${queryParams}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} - ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('Upload response:', responseData);

      const shouldReturnDraftRows = !createMeta && !loadData;

      // If both createMeta and loadData are checked, fetch staging data from MotherDuck
      if (loadData && createMeta) {
        if (!connection || !ready) {
          toast({
            title: "Error",
            description: "MotherDuck connection not ready. Please try again.",
            variant: "destructive",
          });
          setFile(null);
          setUploadProgress(0);
          setCreateMeta(false);
          setLoadData(false);
          onOpenChange(false);
          onSuccess(undefined);
          return;
        }

        try {
          // Query staging table from MotherDuck
          const result = await queryMDTable(connection, namespace, subjectArea, entity);
          console.log('Staging data fetched from MotherDuck:', result);
          
          if (result.rows && result.rows.length > 0) {
            // Add IDs to rows for table rendering
            const rowsWithIds = result.rows.map((row, index) => ({
              ...row,
              id: row.id || `row_${index}`
            }));
            
            setLoadedTableData(rowsWithIds);
            setTableColumns(result.columns || []);
            // Close upload modal first
            onOpenChange(false);
            setFile(null);
            setUploadProgress(0);
            setCreateMeta(false);
            setLoadData(false);
            // Then show staging data modal
            setShowSuccessModal(true);
            // Trigger refetch to update meta table
            onSuccess(undefined);
            
            toast({
              title: "Success",
              description: "Data loaded successfully",
            });
          } else {
            console.warn('No staging data found');
            toast({
              title: "Success",
              description: "File processed but no staging data found",
            });
            setFile(null);
            setUploadProgress(0);
            setCreateMeta(false);
            setLoadData(false);
            onOpenChange(false);
            onSuccess(undefined);
          }
        } catch (error) {
          console.error('Error fetching staging data:', error);
          toast({
            title: "Success",
            description: "File processed but couldn't load staging data",
            variant: "destructive",
          });
          setFile(null);
          setUploadProgress(0);
          setCreateMeta(false);
          setLoadData(false);
          onOpenChange(false);
          onSuccess(undefined);
        }
      } else {
        toast({
          title: "Success",
          description: shouldReturnDraftRows 
            ? "Meta fields detected. Click Save to persist them."
            : "File processed successfully",
        });

        setFile(null);
        setUploadProgress(0);
        setCreateMeta(false);
        setLoadData(false);
        onOpenChange(false);
        onSuccess(shouldReturnDraftRows ? responseData : undefined);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to process file: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setUploadProgress(0);
    setCreateMeta(false);
    setLoadData(false);
    onOpenChange(false);
  };

  return (
    <>
      <style>{`
        .file-upload-content {
          max-width: 28rem;
        }

        @media (min-width: 640px) {
          .file-upload-content {
            max-width: 28rem;
          }
        }

        .file-upload-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-top: 1rem;
          padding-bottom: 1rem;
        }

        .file-upload-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .file-upload-zone {
          border: 2px dashed hsl(var(--muted));
          border-radius: 0.5rem;
          padding: 1.5rem;
          text-align: center;
          transition: border-color 0.2s;
        }

        .file-upload-zone:hover {
          border-color: hsl(var(--primary));
        }

        .file-upload-zone-label {
          cursor: pointer;
        }

        .file-upload-icon {
          height: 2rem;
          width: 2rem;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 0.5rem;
          color: hsl(var(--muted-foreground));
        }

        .file-upload-text {
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
        }

        .file-upload-preview-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .file-upload-preview {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background-color: hsl(var(--muted));
          border-radius: 0.5rem;
        }

        .file-upload-preview-icon {
          height: 1.25rem;
          width: 1.25rem;
          color: hsl(var(--primary));
        }

        .file-upload-preview-name {
          flex: 1;
          font-size: 0.875rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-upload-progress-container {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .file-upload-progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
        }

        .file-upload-checkboxes {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .file-upload-checkbox-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .file-upload-checkbox-label {
          font-size: 0.875rem;
          font-weight: 400;
          cursor: pointer;
        }

        .file-upload-checkbox-label-disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .file-upload-footer {
          display: flex;
          justify-content: space-between;
        }

        @media (min-width: 640px) {
          .file-upload-footer {
            justify-content: space-between;
          }
        }

        .file-upload-loader-icon {
          margin-right: 0.5rem;
          height: 1rem;
          width: 1rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .success-modal-content {
          max-width: 90vw;
          max-height: 85vh;
        }

        .success-modal-data-container {
          overflow: auto;
          display: flex;
          max-height: calc(85vh - 200px);
        }

        .success-modal-button-icon {
          margin-right: 0.5rem;
          height: 1rem;
          width: 1rem;
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="file-upload-content">
          <DialogHeader>
            <DialogTitle>Upload CSV File</DialogTitle>
            <DialogDescription>
              Upload a CSV file to auto-detect and create meta fields for {entity}
            </DialogDescription>
          </DialogHeader>

          <div className="file-upload-body">
            <div className="file-upload-section">
              <Label>CSV File</Label>
              {!file ? (
                <div className="file-upload-zone">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="file-upload-zone-label">
                    <Upload className="file-upload-icon" />
                    <p className="file-upload-text">
                      Click to upload CSV file
                    </p>
                  </label>
                </div>
              ) : (
                <div className="file-upload-preview-container">
                  <div className="file-upload-preview">
                    <FileText className="file-upload-preview-icon" />
                    <span className="file-upload-preview-name">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="file-upload-progress-container">
                    <div className="file-upload-progress-header">
                      <span>Upload Progress</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                </div>
              )}
            </div>

            <div className="file-upload-checkboxes">
              <div className="file-upload-checkbox-row">
                <Checkbox
                  id="create-meta"
                  checked={createMeta}
                  onCheckedChange={(checked) => {
                    setCreateMeta(checked as boolean);
                    if (!checked) setLoadData(false);
                  }}
                  disabled={isUploading}
                />
                <Label
                  htmlFor="create-meta"
                  className="file-upload-checkbox-label"
                >
                  Create Meta
                </Label>
              </div>
              <div className="file-upload-checkbox-row">
                <Checkbox
                  id="load-data"
                  checked={loadData}
                  onCheckedChange={(checked) => setLoadData(checked as boolean)}
                  disabled={isUploading || !createMeta}
                />
                <Label
                  htmlFor="load-data"
                  className={`file-upload-checkbox-label ${!createMeta ? 'file-upload-checkbox-label-disabled' : ''}`}
                >
                  Load Data
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="file-upload-footer">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcess}
              disabled={!file || isUploading}
            >
              {isUploading && <Loader2 className="file-upload-loader-icon" />}
              Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="success-modal-content">
          <DialogHeader>
            <DialogTitle>Data Loaded Successfully</DialogTitle>
            <DialogDescription>
              Data has been loaded for {entity}. Preview the staging data below.
            </DialogDescription>
          </DialogHeader>

          <div className="success-modal-data-container">
            {loadedTableData.length > 0 && tableColumns.length > 0 && (
              <DataTable
                columns={tableColumns.map((col) => ({
                  key: col,
                  title: col,
                  type: "text" as const,
                }))}
                data={loadedTableData}
                entityType="Staging Row"
                onAdd={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
                onSave={() => {}}
              />
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuccessModal(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                navigate(`/staging?ns=${namespace}&sa=${subjectArea}&en=${entity}`);
              }}
            >
              <ExternalLink className="success-modal-button-icon" />
              Go to Table Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}