import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { API_CONFIG } from "@/config/api";

interface ImportConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const SHEET_OPTIONS = [
  { value: "namespace", label: "Namespace" },
  { value: "subjectarea", label: "Subject Area" },
  { value: "meta", label: "Meta" },
  { value: "entity", label: "Entity" },
  { value: "rules", label: "Rules" },
];

export function ImportConfigModal({
  open,
  onOpenChange,
  onSuccess,
}: ImportConfigModalProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [sheetName, setSheetName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file || !sheetName) {
      toast({
        title: "Missing Information",
        description: "Please select both a file and sheet name",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_CONFIG.REST_ENDPOINT}/mwn/import_configuration?sheet_name=${encodeURIComponent(sheetName)}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }

      toast({
        title: "Success",
        description: "Configuration imported successfully",
      });

      handleCancel();
      onSuccess?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to import configuration",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setSheetName("");
    setIsUploading(false);
    onOpenChange(false);
  };

  return (
    <>
      <style>{`
        .import-modal-content {
          max-width: 28rem;
        }

        @media (min-width: 640px) {
          .import-modal-content {
            max-width: 28rem;
          }
        }

        .import-modal-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-top: 1rem;
          padding-bottom: 1rem;
        }

        .import-modal-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .import-modal-label {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .import-modal-required {
          color: hsl(var(--destructive));
        }

        .import-modal-upload-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 8rem;
          border: 2px dashed hsl(var(--muted));
          border-radius: 0.5rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .import-modal-upload-zone:hover {
          background-color: hsl(var(--accent) / 0.5);
        }

        .import-modal-upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-top: 1.25rem;
          padding-bottom: 1.5rem;
        }

        .import-modal-upload-icon {
          width: 2rem;
          height: 2rem;
          margin-bottom: 0.5rem;
          color: hsl(var(--muted-foreground));
        }

        .import-modal-upload-text {
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
        }

        .import-modal-file-preview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          background-color: hsl(var(--accent) / 0.5);
        }

        .import-modal-file-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          min-width: 0;
        }

        .import-modal-file-icon {
          width: 1rem;
          height: 1rem;
          color: hsl(var(--muted-foreground));
          flex-shrink: 0;
        }

        .import-modal-file-name {
          font-size: 0.875rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .import-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        .import-modal-loader-icon {
          margin-right: 0.5rem;
          height: 1rem;
          width: 1rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .import-modal-action-icon {
          margin-right: 0.5rem;
          height: 1rem;
          width: 1rem;
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="import-modal-content">
          <DialogHeader>
            <DialogTitle>Import Configuration</DialogTitle>
            <DialogDescription>
              Upload a configuration file and select the sheet name to import
            </DialogDescription>
          </DialogHeader>

          <div className="import-modal-body">
            <div className="import-modal-field">
              <label className="import-modal-label">
                Sheet Name <span className="import-modal-required">*</span>
              </label>
              <Select value={sheetName} onValueChange={setSheetName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sheet name" />
                </SelectTrigger>
                <SelectContent>
                  {SHEET_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="import-modal-field">
              <label className="import-modal-label">
                File <span className="import-modal-required">*</span>
              </label>
              {!file ? (
                <label className="import-modal-upload-zone">
                  <div className="import-modal-upload-content">
                    <Upload className="import-modal-upload-icon" />
                    <p className="import-modal-upload-text">
                      Click to upload or drag and drop
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".xlsx,.xls,.csv"
                  />
                </label>
              ) : (
                <div className="import-modal-file-preview">
                  <div className="import-modal-file-info">
                    <Upload className="import-modal-file-icon" />
                    <span className="import-modal-file-name">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="import-modal-actions">
            <Button variant="outline" onClick={handleCancel} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || !sheetName || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="import-modal-loader-icon" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="import-modal-action-icon" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}