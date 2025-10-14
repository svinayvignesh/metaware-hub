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
import { useState } from "react";

export default function StartHere() {
  const [openSteps, setOpenSteps] = useState<{ [key: number]: boolean }>({});

  const toggleStep = (stepNumber: number) => {
    setOpenSteps(prev => ({ ...prev, [stepNumber]: !prev[stepNumber] }));
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Start Here</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Welcome to MetaWare</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Your comprehensive metadata management platform. Follow these essential steps to transform your raw data into a powerful business intelligence foundation.
        </p>
      </div>

      <Separator className="my-6" />

      {/* Step 1: Load and Connect Source Data */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl flex-shrink-0">
                1
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl">Load and Connect Source Data</CardTitle>
                <CardDescription className="text-base">
                  Ingest raw data from vendor files, spreadsheets, internal databases, or APIs. MetaWare automatically captures source metadata, data lineage, and maintains a historical audit of all changes—with intelligent auto-detection during the loading process.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Collapsible open={openSteps[1]} onOpenChange={() => toggleStep(1)}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  How to Load Source Data
                </span>
                <ArrowRight className={`h-4 w-4 transition-transform ${openSteps[1] ? 'rotate-90' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileUp className="h-5 w-5 text-primary" />
                    Option 1: Manual Definition & Registration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Define Source Metadata</p>
                      <p className="text-sm text-muted-foreground">Navigate to <strong>Metadata → Sources</strong> to manually define your data source structure, including tables, columns, and data types.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Register the Source</p>
                      <p className="text-sm text-muted-foreground">Complete registration by specifying connection details and validation rules for your data source.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-tertiary" />
                    Option 2: Auto-Detection & Smart Loading
                  </CardTitle>
                  <CardDescription>Recommended for faster setup</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Auto-Detect Metadata</p>
                      <p className="text-sm text-muted-foreground">Go to <strong>Staging</strong> and upload your files. MetaWare's intelligent parser automatically detects schemas, data types, and relationships.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Review & Load Data</p>
                      <p className="text-sm text-muted-foreground">Verify the auto-detected structure and load data directly into MetaWare's data lake for immediate analysis.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Register & Track</p>
                      <p className="text-sm text-muted-foreground">Automatically register the source with lineage tracking and change history enabled from day one.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2 pt-2">
                <Badge variant="secondary" className="gap-1">
                  <History className="h-3 w-3" />
                  Historical Audit
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <GitBranch className="h-3 w-3" />
                  Lineage Tracking
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Database className="h-3 w-3" />
                  Multi-Source Support
                </Badge>
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
                  Create a comprehensive blueprint of your data landscape—starting with business metadata. This includes business terms, reference data, relationships, hierarchies, and underlying business rules. Link glossary entries to sources, models, and reports to establish a single source of truth that powers data integration, business models, reporting, and analytics.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Collapsible open={openSteps[2]} onOpenChange={() => toggleStep(2)}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  How to Build Your Business Blueprint
                </span>
                <ArrowRight className={`h-4 w-4 transition-transform ${openSteps[2] ? 'rotate-90' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Define Business Terms & Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Create Glossary Entries</p>
                      <p className="text-sm text-muted-foreground">Navigate to <strong>Glossary</strong> and define business terms, including definitions, owners, relationships, and hierarchies.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Set Business Rules</p>
                      <p className="text-sm text-muted-foreground">Define validation rules, calculations, and business logic that govern how your data should behave.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-tertiary" />
                    Auto-Detect & Suggest Glossary Terms
                  </CardTitle>
                  <CardDescription>AI-powered suggestions based on your data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Analyze Source Data</p>
                      <p className="text-sm text-muted-foreground">Let MetaWare analyze your loaded sources to identify potential business terms and concepts automatically.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Review Suggestions</p>
                      <p className="text-sm text-muted-foreground">Accept, modify, or reject AI-suggested glossary terms to rapidly build your business vocabulary.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-5 w-5 text-info" />
                    Search Existing Glossary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Leverage Existing Terms</p>
                      <p className="text-sm text-muted-foreground">Use the powerful search in <strong>Glossary</strong> to find and reuse existing business terms across projects.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-warning" />
                    Associate Glossary with Sources & Models
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Link Business Terms to Technical Assets</p>
                      <p className="text-sm text-muted-foreground">Create associations between glossary terms and your data sources, entities, models, and reports for complete traceability.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Establish Data Lineage</p>
                      <p className="text-sm text-muted-foreground">Build end-to-end lineage from source systems through business concepts to final reports and dashboards.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2 pt-2 flex-wrap">
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3 w-3" />
                  Business Glossary
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <GitBranch className="h-3 w-3" />
                  Relationships
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Workflow className="h-3 w-3" />
                  Business Rules
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Link2 className="h-3 w-3" />
                  Source Mapping
                </Badge>
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
                  Transform your business blueprint into production-ready outputs. Publish business-ready models—whether domain-specific models, project models, vendor extracts, report datasets, or inter-departmental data feeds. Deploy with confidence knowing your data is governed, documented, and traceable.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Collapsible open={openSteps[3]} onOpenChange={() => toggleStep(3)}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  How to Publish Models & Extracts
                </span>
                <ArrowRight className={`h-4 w-4 transition-transform ${openSteps[3] ? 'rotate-90' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-primary" />
                    Create or Configure Business Models
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Design Your Model</p>
                      <p className="text-sm text-muted-foreground">Navigate to <strong>Build Models</strong> to create domain models, data marts, or conceptual models using your business blueprint.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Apply Business Rules</p>
                      <p className="text-sm text-muted-foreground">Incorporate business rules, validations, and transformations defined in your glossary.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Map Source to Target</p>
                      <p className="text-sm text-muted-foreground">Define clear mappings from your source systems to target model structures with full lineage tracking.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileOutput className="h-5 w-5 text-success" />
                    Publish as Model or Extract
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Publish Domain Models</p>
                      <p className="text-sm text-muted-foreground">Deploy comprehensive domain models for use across multiple projects and analytics platforms.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Generate Vendor Extracts</p>
                      <p className="text-sm text-muted-foreground">Create vendor-specific data extracts with precise formatting and validation rules.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Export Report Datasets</p>
                      <p className="text-sm text-muted-foreground">Publish curated datasets optimized for BI tools and reporting platforms.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Share Inter-Departmental Feeds</p>
                      <p className="text-sm text-muted-foreground">Enable secure, governed data sharing between departments with automated updates.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2 pt-2 flex-wrap">
                <Badge variant="secondary" className="gap-1">
                  <Boxes className="h-3 w-3" />
                  Domain Models
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <FileOutput className="h-3 w-3" />
                  Data Extracts
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Database className="h-3 w-3" />
                  Report Datasets
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <GitBranch className="h-3 w-3" />
                  Full Lineage
                </Badge>
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
