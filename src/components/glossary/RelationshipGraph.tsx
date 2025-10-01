import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@apollo/client";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  ConnectionLineType,
} from "reactflow";
import "reactflow/dist/style.css";
import { GET_ENTITY_RELATIONS } from "@/graphql/queries/entityrelation";
import type {
  GetEntityRelationsResponse,
  GetEntityRelationsVariables,
  EntityRelation,
  AssociatedSourceEntity,
  EntityMeta,
} from "@/graphql/queries/entityrelation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, Layers, Target } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RelationshipGraphProps {
  entityId: string;
  entityName: string;
}

type NodeData = {
  label: string;
  type: "staging" | "glossary" | "model";
  entity: AssociatedSourceEntity | EntityRelation["related_entity"] | EntityRelation["target_entity"];
};

export const RelationshipGraph = ({ entityId, entityName }: RelationshipGraphProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);

  const { data, loading } = useQuery<GetEntityRelationsResponse, GetEntityRelationsVariables>(
    GET_ENTITY_RELATIONS,
    {
      variables: { relatedEnId: entityId },
      fetchPolicy: "network-only",
    }
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data as NodeData);
  }, []);

  useEffect(() => {
    console.log("🔍 RelationshipGraph data:", data);
    console.log("🔍 Entity ID:", entityId);
    console.log("🔍 Entity Name:", entityName);

    if (!data?.entity_relation) {
      console.warn("⚠️ No entity_relation data");
      return;
    }

    if (data.entity_relation.length === 0) {
      console.warn("⚠️ Empty entity_relation array");
      return;
    }

    console.log("✅ Found relations:", data.entity_relation.length);

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const nodeMap = new Map<string, boolean>();

    // Center glossary entity
    const glossaryNode: Node = {
      id: entityId,
      type: "default",
      position: { x: 400, y: 200 },
      data: {
        label: entityName,
        type: "glossary",
        entity: { id: entityId, name: entityName, type: "glossary" },
      },
      style: {
        background: "hsl(var(--primary))",
        color: "hsl(var(--primary-foreground))",
        border: "2px solid hsl(var(--primary))",
        borderRadius: "8px",
        padding: "16px",
        fontSize: "14px",
        fontWeight: "600",
        width: 200,
      },
    };
    newNodes.push(glossaryNode);
    nodeMap.set(entityId, true);

    let stagingY = 0;
    let modelY = 0;

    data.entity_relation.forEach((relation) => {
      console.log("🔗 Processing relation:", relation);

      // Add staging entities (source) from conceptual models
      if (relation.related_entity?.conceptual_models) {
        relation.related_entity.conceptual_models.forEach((cm) => {
          console.log("📦 Conceptual model:", cm);
          if (cm.associated_source_entities) {
            cm.associated_source_entities.forEach((sourceEntity) => {
              const sourceId = `staging-${sourceEntity.id}`;
              if (!nodeMap.has(sourceId)) {
                console.log("➕ Adding staging node:", sourceEntity.name);
                newNodes.push({
                  id: sourceId,
                  type: "default",
                  position: { x: 50, y: stagingY },
                  data: {
                    label: sourceEntity.name,
                    type: "staging",
                    entity: sourceEntity,
                  },
                  style: {
                    background: "hsl(var(--secondary))",
                    color: "hsl(var(--secondary-foreground))",
                    border: "2px solid hsl(var(--border))",
                    borderRadius: "8px",
                    padding: "12px",
                    fontSize: "12px",
                    width: 180,
                  },
                });
                nodeMap.set(sourceId, true);
                stagingY += 120;
              }

              // Edge from staging to glossary
              newEdges.push({
                id: `e-${sourceId}-${entityId}`,
                source: sourceId,
                target: entityId,
                type: ConnectionLineType.SmoothStep,
                animated: true,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: "hsl(var(--primary))",
                },
                style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
              });
            });
          }
        });
      }

      // If no conceptual models, use the related_entity itself as staging
      if (!relation.related_entity?.conceptual_models || relation.related_entity.conceptual_models.length === 0) {
        const sourceId = `staging-${relation.related_entity.id}`;
        if (!nodeMap.has(sourceId)) {
          console.log("➕ Adding staging node (from related_entity):", relation.related_entity.name);
          newNodes.push({
            id: sourceId,
            type: "default",
            position: { x: 50, y: stagingY },
            data: {
              label: relation.related_entity.name,
              type: "staging",
              entity: relation.related_entity,
            },
            style: {
              background: "hsl(var(--secondary))",
              color: "hsl(var(--secondary-foreground))",
              border: "2px solid hsl(var(--border))",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "12px",
              width: 180,
            },
          });
          nodeMap.set(sourceId, true);
          stagingY += 120;

          // Edge from staging to glossary
          newEdges.push({
            id: `e-${sourceId}-${entityId}`,
            source: sourceId,
            target: entityId,
            type: ConnectionLineType.SmoothStep,
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "hsl(var(--primary))",
            },
            style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
          });
        }
      }
    });

    console.log("📊 Final nodes:", newNodes);
    console.log("📊 Final edges:", newEdges);

    setNodes(newNodes);
    setEdges(newEdges);
  }, [data, entityId, entityName, setNodes, setEdges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-250px)] gap-4">
      <div className="flex-1 border rounded-lg overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {selectedNode && (
        <Card className="w-96 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {selectedNode.type === "staging" && <Database className="h-5 w-5" />}
              {selectedNode.type === "glossary" && <Layers className="h-5 w-5" />}
              {selectedNode.type === "model" && <Target className="h-5 w-5" />}
              <CardTitle className="text-lg">{selectedNode.label}</CardTitle>
            </div>
            <Badge variant="secondary" className="w-fit">
              {selectedNode.type.toUpperCase()}
            </Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Description</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedNode.entity.description || "No description"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="font-medium">Type</p>
                    <p className="text-muted-foreground">{selectedNode.entity.type}</p>
                  </div>
                  <div>
                    <p className="font-medium">Subtype</p>
                    <p className="text-muted-foreground">{selectedNode.entity.subtype || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-medium">Primary Grain</p>
                    <p className="text-muted-foreground">{selectedNode.entity.primary_grain || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-medium">Runtime</p>
                    <p className="text-muted-foreground">{selectedNode.entity.runtime || "N/A"}</p>
                  </div>
                </div>

                {selectedNode.type === "staging" && "metas" in selectedNode.entity && (
                  <div>
                    <p className="text-sm font-medium mb-2">Meta Fields</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Grain</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedNode.entity.metas.map((meta: EntityMeta) => (
                          <TableRow key={meta.id}>
                            <TableCell className="font-medium">{meta.name}</TableCell>
                            <TableCell>{meta.type}</TableCell>
                            <TableCell>
                              {meta.is_primary_grain && <Badge variant="default">P</Badge>}
                              {meta.is_secondary_grain && <Badge variant="secondary">S</Badge>}
                              {meta.is_tertiary_grain && <Badge variant="outline">T</Badge>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
