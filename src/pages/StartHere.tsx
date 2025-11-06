import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Database, BookOpen, Workflow, FileUp, FileText, GitBranch, History, Search, Link2, FileOutput, Boxes, Sparkles, CheckCircle2 } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export default function StartHere() {
  const [openSteps, setOpenSteps] = useState<{ [key: number]: boolean }>({});

  const toggleStep = useCallback((stepNumber: number) => {
    setOpenSteps(prev => ({ ...prev, [stepNumber]: !prev[stepNumber] }));
  }, []);

  return (
    <div className="stack-lg">
      <div className="stack-sm">
        <h1 className="text-4xl font-bold text-foreground">Welcome to MetaWare</h1>
        <p className="text-xl text-muted-foreground font-medium">
          Your solution for standardizing business data
        </p>
        <p className="text-subheading max-w-3xl">
          Follow these essential steps to transform your raw data into a powerful business intelligence foundation.
        </p>
      </div>

      <Separator className="my-6" />

      {/* Step 1: Load and Connect Source Data */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex-between">
            <div className="flex-start gap-md">
              <div className="flex-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl flex-shrink-0">
                1
              </div>
              <div className="stack-sm">
                <CardTitle className="text-heading-md">Load and Connect Source Data</CardTitle>
                <CardDescription className="text-base">
                  Create appropriate Namespace, Subject Area & Entities to organize your data structure.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="stack-md">
          <Collapsible open={openSteps[1]} onOpenChange={() => toggleStep(1)}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="button-anim w-full flex-between hover:bg-muted">
                <span className="flex-start gap-sm">
                  <BookOpen className="icon-sm" />
                  How to Load Source Data
                </span>
                <ArrowRight className={cn(
                  "icon-sm transform-gpu will-change-transform transition-transform duration-300 ease-in-out",
                  openSteps[1] && "rotate-90"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 stack-md">
              <div className="space-y-3">
                <div className="flex-start gap-3">
                  <CheckCircle2 className="icon-md text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Navigate to Meta</p>
                    <p className="text-muted">Select your entity, then click on <strong>meta file upload</strong>.</p>
                  </div>
                </div>
                <div className="flex-start gap-3">
                  <CheckCircle2 className="icon-md text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Upload Your File</p>
                    <p className="text-muted">Upload your file and select <strong>create meta and load data</strong>.</p>
                  </div>
                </div>
                <div className="flex-start gap-3">
                  <CheckCircle2 className="icon-md text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">View in Staging</p>
                    <p className="text-muted">Once Meta and data have been loaded, the entities can be viewed under <strong>Staging</strong>.</p>
                  </div>
                </div>
                <div className="flex-start gap-3">
                  <CheckCircle2 className="icon-md text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Apply Data Quality Rules</p>
                    <p className="text-muted">Data Quality rules can be applied on these new columns by clicking on the column name in the staging data table for that entity.</p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Step 2: Define Your Business Blueprint */}
      <Card className="border-l-4 border-l-tertiary">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-tertiary/10 text-tertiary font-bold text-xl flex-shrink-0">
                2
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl">Define Your Business Blueprint</CardTitle>
                <CardDescription className="text-base">
                  Create glossary entities and generate standardized metadata to establish your business vocabulary and mapping.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Collapsible open={openSteps[2]} onOpenChange={() => toggleStep(2)}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="button-anim w-full justify-between hover:bg-muted">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  How to Build Your Business Blueprint
                </span>
                <ArrowRight className={cn(
                  "h-4 w-4 transform-gpu will-change-transform transition-transform duration-300 ease-in-out",
                  openSteps[2] && "rotate-90"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Create Glossary Entities</p>
                    <p className="text-sm text-muted-foreground">Create glossary entities accordingly, then click on <strong>Generate Standardized Meta</strong> to automatically generate standardized meta values for the entity.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Edit and Save Meta</p>
                    <p className="text-sm text-muted-foreground">These can be edited and saved according to user requirements.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Map Source Associations</p>
                    <p className="text-sm text-muted-foreground">Once the glossary meta has been saved, we move on to the <strong>source associations</strong> tab where we map the standardized glossary meta values to the raw staging entity columns.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">View Relationships</p>
                    <p className="text-sm text-muted-foreground">Once the mapping has been done, we can view the connections graphically in <strong>Glossary Relationship Graph</strong>.</p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Step 3: Publish Models & Extracts */}
      <Card className="border-l-4 border-l-success">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/10 text-success font-bold text-xl flex-shrink-0">
                3
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl">Publish Models & Extracts</CardTitle>
                <CardDescription className="text-base">
                  Finally, here we transform our business blueprints into awesome production ready outputs.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Collapsible open={openSteps[3]} onOpenChange={() => toggleStep(3)}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="button-anim w-full justify-between hover:bg-muted">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  How to Publish Models & Extracts
                </span>
                <ArrowRight className={cn(
                  "h-4 w-4 transform-gpu will-change-transform transition-transform duration-300 ease-in-out",
                  openSteps[3] && "rotate-90"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Navigate to Publish</p>
                    <p className="text-sm text-muted-foreground">Go to <strong>Publish</strong>, then click on <strong>Build Models</strong>.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Select Business Glossary</p>
                    <p className="text-sm text-muted-foreground">There, select a Business Glossary (Blueprint) Meta Data from the cascading dropdown and set your project code - default model.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Build Artifacts</p>
                    <p className="text-sm text-muted-foreground">Select the meta for the model and click on <strong>Build Artifacts</strong>.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Load Data</p>
                    <p className="text-sm text-muted-foreground">On Success, move on to Step 2 - Load Data and Click on <strong>Load Data</strong> to see the Publish Model.</p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Quick Links Section */}
      <Card className="bg-gradient-to-br from-primary/5 to-tertiary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl">Quick Access</CardTitle>
          <CardDescription>Jump to the most commonly used areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <a href="/staging">
                <div className="flex flex-col items-start gap-1 w-full">
                  <div className="flex items-center gap-2">
                    <FileUp className="h-4 w-4" />
                    <span className="font-medium">Staging Area</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Upload & process data</span>
                </div>
              </a>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <a href="/glossary">
                <div className="flex flex-col items-start gap-1 w-full">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-medium">Glossary</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Manage business terms</span>
                </div>
              </a>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <a href="/build-models">
                <div className="flex flex-col items-start gap-1 w-full">
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4" />
                    <span className="font-medium">Build Models</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Create data models</span>
                </div>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
