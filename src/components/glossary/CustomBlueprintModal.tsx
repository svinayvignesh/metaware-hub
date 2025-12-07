import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { glossaryAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface CustomBlueprintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  glossaryEntity: any;
  onSuccess: (standardizedMeta: any[], mappings: any[]) => void;
}

export function CustomBlueprintModal({
  open,
  onOpenChange,
  glossaryEntity,
  onSuccess,
}: CustomBlueprintModalProps) {
  const [topic, setTopic] = useState("");
  const [numFields, setNumFields] = useState(10);
  const [exampleData, setExampleData] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!topic.trim() && !exampleData.trim()) {
      toast({
        title: "Input required",
        description: "Please describe a topic or provide example data.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const targetNs = glossaryEntity.subjectarea?.namespace?.name || "";
      const targetSa = glossaryEntity.subjectarea?.name || "";
      const targetEn = glossaryEntity.name || "";
      
      const response = await glossaryAPI.generateCustomBlueprint({
        topic: topic.trim(),
        num_fields: numFields,
        example_data: exampleData.trim(),
        target_ns: targetNs,
        target_sa: targetSa,
        target_en: targetEn,
      }) as any;
      
      // Transform the response into the format needed for StandardizedMetaEditor
      const standardizedMetas = response.return_data?.standardized_metas || [];
      const transformedMeta = standardizedMetas.map((meta: any, index: number) => ({
        id: `temp-${index}`,
        type: meta.type,
        subtype: meta.subtype || "",
        name: meta.name,
        alias: meta.alias || "",
        description: meta.description || "",
        order: meta.order || index,
        length: meta.length || null,
        default: meta.default || null,
        nullable: meta.nullable ?? true,
        format: meta.format || null,
        is_primary_grain: meta.is_primary_grain ?? false,
        is_secondary_grain: false,
        is_tertiary_grain: false,
        tags: "",
        custom_props: [],
      }));
      
      // No mappings for custom blueprint since there's no source entity
      onSuccess(transformedMeta, []);
      onOpenChange(false);
      
      // Reset form
      setTopic("");
      setNumFields(10);
      setExampleData("");
    } catch (error) {
      console.error("Error generating custom blueprint:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate custom blueprint",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTopic("");
    setNumFields(10);
    setExampleData("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex-start gap-sm">
            <Wand2 className="icon-md icon-primary" />
            Generate Custom Blueprint
          </DialogTitle>
          <p className="text-muted text-sm">
            Use AI to generate fields based on your topic or example data.
          </p>
        </DialogHeader>

        <div className="stack-lg py-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 stack-sm">
              <Label htmlFor="topic">Describe your topic:</Label>
              <Input
                id="topic"
                placeholder='Examples: "flight logs", "social media", "stock trades"'
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="w-24 stack-sm">
              <Label htmlFor="numFields"># Fields:</Label>
              <Input
                id="numFields"
                type="number"
                min={1}
                max={50}
                value={numFields}
                onChange={(e) => setNumFields(parseInt(e.target.value) || 10)}
              />
            </div>
          </div>

          <div className="flex-center gap-4">
            <Separator className="flex-1" />
            <span className="text-muted text-sm">OR</span>
            <Separator className="flex-1" />
          </div>

          <div className="stack-sm">
            <Label htmlFor="exampleData">Provide some example data:</Label>
            <Textarea
              id="exampleData"
              placeholder="Paste CSV, JSON, or XML here..."
              className="min-h-[150px] font-mono text-sm"
              value={exampleData}
              onChange={(e) => setExampleData(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={(!topic.trim() && !exampleData.trim()) || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="icon-sm mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Fields"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}