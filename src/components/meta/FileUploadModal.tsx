import { useState } from "react";
import { X, Upload, FileText, Loader2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const { toast } = useToast();

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
      setUploadProgress(100); // Show full progress when file is selected
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
        ns_type: namespaceType,
        create_meta: String(createMeta),
        load_data: String(loadData),
        primary_grain: primaryGrain || '',
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

      // If both create_meta and load_data are false, pass the detected fields as draft rows
      const shouldReturnDraftRows = !createMeta && !loadData;

      // If load data was checked, show the success modal with table data
      if (loadData && createMeta) {
        // Fetch the loaded data to display
        const tableResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/mwn/table_data?ns=${namespace}&sa=${subjectArea}&en=${entity}`
        );
        
        if (tableResponse.ok) {
          const tableData = await tableResponse.json();
          setLoadedTableData(tableData);
          setShowSuccessModal(true);
        }
      }

      toast({
        title: "Success",
        description: shouldReturnDraftRows 
          ? "Meta fields detected. Click Save to persist them."
          : "File processed successfully",
      });

      // Reset form
      setFile(null);
      setUploadProgress(0);
      setCreateMeta(false);
      setLoadData(false);
      onOpenChange(false);
      
      if (!loadData || !createMeta) {
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload CSV File</DialogTitle>
            <DialogDescription>
              Upload a CSV file to auto-detect and create meta fields for {entity}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Upload Section */}
            <div className="space-y-2">
              <Label>CSV File</Label>
              {!file ? (
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload CSV file
                    </p>
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="flex-1 text-sm truncate">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Upload Progress</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                </div>
              )}
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
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
                  className="text-sm font-normal cursor-pointer"
                >
                  Create Meta
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="load-data"
                  checked={loadData}
                  onCheckedChange={(checked) => setLoadData(checked as boolean)}
                  disabled={isUploading || !createMeta}
                />
                <Label
                  htmlFor="load-data"
                  className={`text-sm font-normal ${!createMeta ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  Load Data
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
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
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal with Data Table */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Data Loaded Successfully</DialogTitle>
            <DialogDescription>
              Data has been loaded for {entity}. Preview the data below.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-auto max-h-[50vh]">
            {loadedTableData.length > 0 && (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    {Object.keys(loadedTableData[0]).map((key) => (
                      <th key={key} className="p-2 text-left text-sm font-medium">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadedTableData.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="border-b">
                      {Object.values(row).map((value: any, colIdx) => (
                        <td key={colIdx} className="p-2 text-sm">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {loadedTableData.length > 10 && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing 10 of {loadedTableData.length} rows
              </p>
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
              <ExternalLink className="mr-2 h-4 w-4" />
              Go to Table Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
