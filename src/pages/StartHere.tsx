import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Database, BookOpen, Workflow, FileUp, FileText, GitBranch, History, Search, Link2, FileOutput, Boxes, Sparkles, CheckCircle2, Layers, FolderTree, Table2, Wand2, ArrowDown, Zap } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "starthere-expanded-steps";

export default function StartHere() {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      }
    } catch (error) {
      console.error("Failed to load expanded steps from localStorage:", error);
    }
    return new Set();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(expandedSteps)));
    } catch (error) {
      console.error("Failed to save expanded steps to localStorage:", error);
    }
  }, [expandedSteps]);

  const toggleStep = useCallback((stepNumber: number) => {
    setExpandedSteps(prev => {
      const newExpanded = new Set(prev);
      
      if (newExpanded.has(stepNumber)) {
        // Closing logic: close from this step onwards
        if (stepNumber === 1) {
          // Close all steps
          return new Set();
        } else if (stepNumber === 2) {
          // Close steps 2 and 3
          newExpanded.delete(2);
          newExpanded.delete(3);
        } else {
          // Close only step 3
          newExpanded.delete(3);
        }
      } else {
        // Opening logic: must open in order
        if (stepNumber === 1) {
          newExpanded.add(1);
        } else if (stepNumber === 2) {
          if (newExpanded.has(1)) {
            newExpanded.add(2);
          }
        } else if (stepNumber === 3) {
          if (newExpanded.has(1) && newExpanded.has(2)) {
            newExpanded.add(3);
          }
        }
      }
      
      return newExpanded;
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-tertiary/10 to-success/10 border-b">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            Start Your Journey
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-4 animate-fade-in">
            Welcome to MetaWare
          </h1>
          <p className="text-2xl text-muted-foreground font-medium mb-3 animate-fade-in">
            Your solution for standardizing business data
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto animate-fade-in">
            Transform raw data into powerful business intelligence in three intuitive steps
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Journey Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Step 1 */}
          <div className="group relative animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <Card className="h-full border-2 border-primary/20 hover:border-primary/40 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-2xl shadow-lg">
                    1
                  </div>
                  <Database className="h-8 w-8 text-primary opacity-50" />
                </div>
                <CardTitle className="text-2xl mb-2">Build Your Foundation</CardTitle>
                <CardDescription className="text-base">
                  Set up your data structure with namespaces, subject areas, and entities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  onClick={() => toggleStep(1)}
                  className="w-full justify-between mb-4 hover:bg-primary/10"
                >
                  <span className="font-medium">View Details</span>
                  <ArrowDown className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    expandedSteps.has(1) && "rotate-180"
                  )} />
                </Button>

                {expandedSteps.has(1) && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <FolderTree className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm mb-1">Create Your Organization</p>
                          <p className="text-sm text-muted-foreground">Start by defining <strong>Namespaces</strong> to organize your data landscape. Then add <strong>Subject Areas</strong> to group related data.</p>
                          <Link to="/metadata/namespace" className="inline-flex items-center gap-1 text-primary text-sm font-medium mt-2 hover:underline">
                            Go to Metadata <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <Table2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm mb-1">Define Your Entities & Types</p>
                          <p className="text-sm text-muted-foreground mb-2">Create entities with specific types:</p>
                          <div className="grid grid-cols-2 gap-2 ml-2">
                            <Badge variant="secondary" className="justify-start">
                              <Database className="h-3 w-3 mr-1" />
                              Staging
                            </Badge>
                            <Badge variant="secondary" className="justify-start">
                              <BookOpen className="h-3 w-3 mr-1" />
                              Glossary
                            </Badge>
                            <Badge variant="secondary" className="justify-start">
                              <Layers className="h-3 w-3 mr-1" />
                              Model
                            </Badge>
                            <Badge variant="secondary" className="justify-start">
                              <FileText className="h-3 w-3 mr-1" />
                              Reference
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <FileUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm mb-1">Upload & Load Your Data</p>
                          <p className="text-sm text-muted-foreground">Navigate to <Link to="/metadata/meta" className="text-primary hover:underline">Meta</Link>, select your entity, and click <strong>meta file upload</strong>. Upload your file and select <strong>create meta and load data</strong>.</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm mb-1">View & Validate</p>
                          <p className="text-sm text-muted-foreground">Once loaded, view your entities in <Link to="/staging" className="text-primary hover:underline font-semibold">Staging</Link>. Apply data quality rules by clicking column names in the staging data table.</p>
                        </div>
                      </div>
                    </div>

                    <Link to="/metadata/namespace">
                      <Button className="w-full group">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                )}

                {!expandedSteps.has(1) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>Create structured data foundations</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Arrow connector */}
            <div className="hidden lg:block absolute top-1/2 -right-8 transform -translate-y-1/2 z-10">
              <ArrowRight className="h-8 w-8 text-primary/40" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="group relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Card className="h-full border-2 border-tertiary/20 hover:border-tertiary/40 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-tertiary/5">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-tertiary to-tertiary/70 text-white font-bold text-2xl shadow-lg">
                    2
                  </div>
                  <Wand2 className="h-8 w-8 text-tertiary opacity-50" />
                </div>
                <CardTitle className="text-2xl mb-2">Design Your Blueprint</CardTitle>
                <CardDescription className="text-base">
                  Create your business glossary and map it to your data sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  onClick={() => toggleStep(2)}
                  className="w-full justify-between mb-4 hover:bg-tertiary/10"
                >
                  <span className="font-medium">View Details</span>
                  <ArrowDown className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    expandedSteps.has(2) && "rotate-180"
                  )} />
                </Button>

                {expandedSteps.has(2) && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <BookOpen className="h-5 w-5 text-tertiary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm mb-1">Create Glossary Entities</p>
                          <p className="text-sm text-muted-foreground">Navigate to <Link to="/glossary" className="text-primary hover:underline font-semibold">Glossary</Link> and create your glossary entities to define your business vocabulary.</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-tertiary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm mb-1">Generate Standardized Blueprint</p>
                          <p className="text-sm text-muted-foreground">Click on <strong>Generate Standardized Blueprint</strong> to automatically create standardized meta values. Edit and save according to your requirements.</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <Link2 className="h-5 w-5 text-tertiary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm mb-1">Map Source Associations</p>
                          <p className="text-sm text-muted-foreground">Head to the <strong>source associations</strong> tab and map your standardized glossary meta values to raw staging entity columns.</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <GitBranch className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm mb-1">Visualize Relationships</p>
                          <p className="text-sm text-muted-foreground">View your data connections graphically in the <strong>Glossary Relationship Graph</strong>.</p>
                        </div>
                      </div>
                    </div>

                    <Link to="/glossary">
                      <Button className="w-full group" variant="secondary">
                        Open Glossary
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                )}

                {!expandedSteps.has(2) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>Build business vocabulary & mapping</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Arrow connector */}
            <div className="hidden lg:block absolute top-1/2 -right-8 transform -translate-y-1/2 z-10">
              <ArrowRight className="h-8 w-8 text-tertiary/40" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="group relative animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Card className="h-full border-2 border-success/20 hover:border-success/40 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-success/5">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-success to-success/70 text-white font-bold text-2xl shadow-lg">
                    3
                  </div>
                  <Boxes className="h-8 w-8 text-success opacity-50" />
                </div>
                <CardTitle className="text-2xl mb-2">Publish & Deploy</CardTitle>
                <CardDescription className="text-base">
                  Transform blueprints into production-ready data models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  onClick={() => toggleStep(3)}
                  className="w-full justify-between mb-4 hover:bg-success/10"
                >
                  <span className="font-medium">View Details</span>
                  <ArrowDown className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    expandedSteps.has(3) && "rotate-180"
                  )} />
                </Button>

                {expandedSteps.has(3) && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Boxes className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm mb-1">Navigate to Publish</p>
                          <p className="text-sm text-muted-foreground">Go to <Link to="/model" className="text-primary hover:underline font-semibold">Publish</Link> and click on <strong>Build Models</strong>.</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm mb-1">Select Your Blueprint</p>
                          <p className="text-sm text-muted-foreground">Choose a Business Glossary (Blueprint) Meta Data from the dropdown and set your project code to "default model".</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <Workflow className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm mb-1">Build Artifacts</p>
                          <p className="text-sm text-muted-foreground">Select the meta for your model and click <strong>Build Artifacts</strong> to generate your production model.</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm mb-1">Load & View</p>
                          <p className="text-sm text-muted-foreground">On success, move to Step 2 - Load Data and click <strong>Load Data</strong> to see your published model in action!</p>
                        </div>
                      </div>
                    </div>

                    <Link to="/model">
                      <Button className="w-full group" variant="default">
                        Start Publishing
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                )}

                {!expandedSteps.has(3) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>Deploy production-ready models</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Access Section */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-card via-primary/5 to-tertiary/5 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Ready to Jump In?</CardTitle>
            <CardDescription>Quick access to the most commonly used areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/staging" className="group">
                <Card className="h-full border-2 border-muted hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Database className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Staging Area</p>
                        <p className="text-xs text-muted-foreground">Upload & process your data</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/glossary" className="group">
                <Card className="h-full border-2 border-muted hover:border-tertiary/40 hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center group-hover:bg-tertiary/20 transition-colors">
                        <BookOpen className="h-6 w-6 text-tertiary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Glossary</p>
                        <p className="text-xs text-muted-foreground">Manage business terms</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-tertiary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/model" className="group">
                <Card className="h-full border-2 border-muted hover:border-success/40 hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                        <Boxes className="h-6 w-6 text-success" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Publish Models</p>
                        <p className="text-xs text-muted-foreground">Create data models</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-success group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
