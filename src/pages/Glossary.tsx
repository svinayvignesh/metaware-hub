import { useState, useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { SubSidebar } from "@/components/layout/SubSidebar";
import { EntityGrid } from "@/components/entity/EntityGrid";
import { DataTable } from "@/components/table/DataTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, X, Database, Loader2, Upload } from "lucide-react";
import { GET_META_FOR_ENTITY, type MetaField } from "@/graphql/queries/meta";
import { GET_RULESETS_BY_ENTITY, type RulesetWithSource } from "@/graphql/queries/ruleset";
import { SourceAssociationSelect } from "@/components/glossary/SourceAssociationSelect";
import { MappingTable } from "@/components/glossary/MappingTable";
import { RelationshipGraph } from "@/components/glossary/RelationshipGraph";
import { ImportConfigModal } from "@/components/glossary/ImportConfigModal";
import { type Entity } from "@/graphql/queries/entity";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";

export default function Glossary() {
  const [selectedSubjectAreaId, setSelectedSubjectAreaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [metaFields, setMetaFields] = useState<MetaField[]>([]);
  const [sourceEntity, setSourceEntity] = useState<Entity | null>(null);
  const [activeTab, setActiveTab] = useState("meta");
  const [existingRuleset, setExistingRuleset] = useState<RulesetWithSource | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const [fetchMeta, { loading: metaLoading }] = useLazyQuery(GET_META_FOR_ENTITY, {
    onCompleted: (data) => {
      if (data?.meta_meta) {
        setMetaFields(data.meta_meta);
      }
    },
    onError: (error) => {
      console.error("Error fetching meta:", error);
    },
  });

  const [fetchRulesets] = useLazyQuery(GET_RULESETS_BY_ENTITY, {
    onCompleted: (data) => {
      if (data.meta_ruleset && data.meta_ruleset.length > 0) {
        const matchingRuleset = data.meta_ruleset.find(
          (rs: RulesetWithSource) =>
            rs.source?.source_en_id === sourceEntity?.id
        );
        setExistingRuleset(matchingRuleset || null);
      } else {
        setExistingRuleset(null);
      }
    },
    onError: (error) => {
      console.error("Error fetching rulesets:", error);
      setExistingRuleset(null);
    },
  });

  // Reset selected entity when subject area changes
  useEffect(() => {
    setSelectedEntity(null);
    setSourceEntity(null);
    setExistingRuleset(null);
  }, [selectedSubjectAreaId]);

  // Fetch meta when entity is selected
  useEffect(() => {
    if (selectedEntity) {
      fetchMeta({ variables: { enid: selectedEntity.id } });
      setSourceEntity(null);
      setExistingRuleset(null);
    }
  }, [selectedEntity, fetchMeta]);

  // Fetch existing rulesets when source entity is selected
  useEffect(() => {
    if (selectedEntity && sourceEntity) {
      fetchRulesets({
        variables: {
          targetEnId: selectedEntity.id,
          type: "glossary_association",
        },
      });
    } else {
      setExistingRuleset(null);
    }
  }, [selectedEntity, sourceEntity, fetchRulesets]);

  const columns = metaFields.map((meta) => ({
    key: meta.alias,
    title: meta.name,
    type: meta.type as any,
  }));

  return (
    <div className="flex h-[calc(100vh-3.5rem)] fixed left-64 right-0 top-14">
      <SubSidebar
        namespaceType="glossary"
        onSubjectAreaSelect={setSelectedSubjectAreaId}
        selectedSubjectAreaId={selectedSubjectAreaId || undefined}
      />
      
      <div className="flex-1 overflow-hidden">
        {!selectedEntity ? (
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Business Glossary</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Business Glossary</h1>
              <p className="text-muted-foreground">
                Manage business terms and definitions
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search entities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setImportModalOpen(true)}
                title="Import configuration"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSubjectAreaId(null);
                }}
                title="Reset search and filters"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ImportConfigModal
              open={importModalOpen}
              onOpenChange={setImportModalOpen}
              onSuccess={() => {
                // Optionally refresh data after import
              }}
            />

            <EntityGrid
              subjectAreaId={selectedSubjectAreaId || undefined}
              namespaceType="glossary"
              searchQuery={searchQuery}
              onEntityClick={setSelectedEntity}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col p-6">
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/glossary">Business Glossary</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{selectedEntity.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="mb-4 flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEntity(null)}
              >
                ← Back to list
              </Button>
              <div className="flex-1">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  {selectedEntity.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedEntity.subjectarea.namespace.name} / {selectedEntity.subjectarea.name}
                </p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList>
                <TabsTrigger value="meta">Meta</TabsTrigger>
                <TabsTrigger value="associations">Source Associations</TabsTrigger>
                <TabsTrigger value="relationships">Glossary Relationship</TabsTrigger>
              </TabsList>

              <TabsContent value="meta" className="flex-1 overflow-hidden mt-4">
                {metaLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : metaFields.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-2">
                      <Database className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No metadata found</p>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden h-full">
                    <div className="overflow-auto h-full">
                      <table className="w-full">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left p-4 font-medium">Name</th>
                            <th className="text-left p-4 font-medium">Alias</th>
                            <th className="text-left p-4 font-medium">Type</th>
                            <th className="text-left p-4 font-medium">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metaFields.map((field) => (
                            <tr key={field.id} className="border-t hover:bg-muted/30">
                              <td className="p-4">{field.name}</td>
                              <td className="p-4 font-mono text-sm">{field.alias}</td>
                              <td className="p-4">{field.type}</td>
                              <td className="p-4 text-muted-foreground">
                                {field.description || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="associations" className="flex-1 overflow-auto mt-4">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Association</label>
                    <SourceAssociationSelect
                      glossaryEntity={selectedEntity}
                      value={sourceEntity?.id}
                      onSelect={setSourceEntity}
                    />
                  </div>

                  {sourceEntity && (
                    <MappingTable
                      glossaryEntity={selectedEntity}
                      sourceEntity={sourceEntity}
                      existingRuleset={existingRuleset || undefined}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="relationships" className="flex-1 overflow-hidden mt-4">
                <RelationshipGraph
                  entityId={selectedEntity.id}
                  entityName={selectedEntity.name}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}