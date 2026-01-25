import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Search,
    Plus,
    Trash2,
    Link as LinkIcon,
    ArrowRight,
    GitBranch,
    Layers,
    ArrowLeftRight,
    Loader2,
    Info,
    Network,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@apollo/client";
import {
    GET_GLOSSARY_RELATIONS,
    GetGlossaryRelationsResponse,
    GetGlossaryRelationsVariables,
} from "@/graphql/queries/glossaryrelation";
import { Entity } from "@/graphql/queries/entity";
import { MetaField } from "@/graphql/queries/meta";
import { GlossaryTermCascadingSelect } from "./GlossaryTermCascadingSelect";
import { GlossaryModelGraph } from "./GlossaryModelGraph";
import { API_CONFIG } from "@/config/api";

// Static Relation Types
const relationTypes = [
    {
        id: "EXACT",
        short_description: "EXACT MATCH",
        description: "Glossary definition exactly matches the meaning of the column definition",
    },
    {
        id: "RELATED",
        short_description: "RELATED TERM",
        description: "Glossary definition might not directly match the column definition, but it is related to it in some way",
    },
    {
        id: "SUBSET",
        short_description: "SUBSET",
        description: "Glossary definition is a subset of the column definition",
    },
    {
        id: "LINK",
        short_description: "LINK",
        description: "Alternative term that can be used interchangeably",
    },
];

interface GlossaryAssociationsProps {
    glossaryEntity: Entity;
    metaFields: MetaField[];
    showGraph: boolean;
    onShowGraphChange: (show: boolean) => void;
}

export function GlossaryAssociations({ glossaryEntity, metaFields, showGraph, onShowGraphChange }: GlossaryAssociationsProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGlossary, setSelectedGlossary] = useState<string | null>(null);
    const [isAddRelationOpen, setIsAddRelationOpen] = useState(false);
    const [newRelationType, setNewRelationType] = useState("");
    // showGraph state moved to parent

    // State for the cascading select
    const [newRelatedEntity, setNewRelatedEntity] = useState<Entity | null>(null);
    const [newRelatedMeta, setNewRelatedMeta] = useState<MetaField | null>(null);
    const [isAddingRequest, setIsAddingRequest] = useState(false);

    // Fetch existing relations for the WHOLE entity to show counts
    const { data: relationsData, loading: relationsLoading, refetch: refetchRelations } = useQuery<
        GetGlossaryRelationsResponse,
        GetGlossaryRelationsVariables
    >(GET_GLOSSARY_RELATIONS, {
        variables: { entityId: glossaryEntity.id },
        fetchPolicy: "network-only",
    });

    const relations = relationsData?.glossary_relation || [];

    // Calculate relation counts per glossary term
    const relationCounts = relations.reduce((acc, rel) => {
        const glossaryId = rel.drivingGlossaryId;
        acc[glossaryId] = (acc[glossaryId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Filter relations for the selected term
    const glossaryRelations = relations.filter(r => r.drivingGlossaryId === selectedGlossary);

    const filteredGlossary = metaFields
        .filter(
            (term) =>
                term.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                term.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (term.description && term.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => {
            const countA = relationCounts[a.id] || 0;
            const countB = relationCounts[b.id] || 0;
            // Sort by count descending, then by name ascending
            return countB - countA || a.name.localeCompare(b.name);
        });

    const selectedGlossaryData = metaFields.find((g) => g.id === selectedGlossary);

    const getRelationType = (code: string) => relationTypes.find((rt) => rt.id === code);

    const handleAddRelation = async () => {
        if (!selectedGlossary || !newRelationType || !newRelatedEntity || !newRelatedMeta) {
            toast.error("Please fill all fields");
            return;
        }

        setIsAddingRequest(true);
        try {
            const payload = {
                entity_core: {
                    ns: glossaryEntity.subjectarea?.namespace?.alias,
                    sa: glossaryEntity.subjectarea?.alias,
                    en: glossaryEntity.alias,
                    ns_type: "glossary", // assuming namespace type is glossary derived from context
                    ns_id: glossaryEntity.subjectarea?.namespace?.id,
                    sa_id: glossaryEntity.sa_id,
                    en_id: glossaryEntity.id,
                },
                glossary_relation_request: {
                    driving_glossary_id: selectedGlossary,
                    related_glossary_id: newRelatedMeta.id,
                    driving_entity_id: glossaryEntity.id,
                    related_entity_id: newRelatedEntity.id,
                    relation_type_code: newRelationType,
                    cardinality: "1:1", // Default to 1:1 as per example, or could be user input
                    key_sequence: 1, // Defaulting
                },
            };

            const response = await fetch(`${API_CONFIG.REST_ENDPOINT}/mwn/glossary_relation`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create relation: ${errorText}`);
            }

            toast.success("Relation added successfully");
            setIsAddRelationOpen(false);

            // Reset form
            setNewRelationType("");
            setNewRelatedEntity(null);
            setNewRelatedMeta(null);

            // Refetch relations
            await refetchRelations();
        } catch (error) {
            console.error("Error adding relation:", error);
            toast.error(error instanceof Error ? error.message : "Failed to add relation");
        } finally {
            setIsAddingRequest(false);
        }
    };

    const handleDeleteRelation = async (relationId: string) => {
        // Mock delete for now as per previous instruction
        toast.error("Delete API not specified in requirements");
    };

    // Helper to get badges for a term
    const getRelationBadges = (termId: string) => {
        const termRelations = relations.filter(r => r.drivingGlossaryId === termId || r.relatedGlossaryId === termId);
        if (termRelations.length === 0) return null;

        const counts: Record<string, number> = { EXACT: 0, RELATED: 0, SUBSET: 0, LINK: 0 };
        termRelations.forEach(r => {
            if (counts[r.relationTypeCode] !== undefined) counts[r.relationTypeCode]++;
        });

        const mapping: Record<string, string> = { EXACT: "EM", RELATED: "RT", SUBSET: "S", LINK: "L" };

        return (
            <div className="flex items-center gap-1">
                {Object.entries(counts).map(([type, count]) => {
                    if (count === 0) return null;
                    const colorClass = getRelationColor(type).replace("text-", "border-").replace("bg-", "text-"); // Hacky way to derive border color or just use the color class directly
                    // Actually, let's just use the same color function but apply it to background/text appropriately
                    // The user wants "same color to the icons as in the info section".
                    // getRelationColor returns "bg-green-500/10 text-green-600" etc.

                    return (
                        <Badge key={type} className={`text-[10px] h-4 px-1 ${getRelationColor(type)} border-0`}>
                            {mapping[type]}-{count}
                        </Badge>
                    );
                })}
            </div>
        );
    };

    const getRelationIcon = (code: string) => {
        switch (code) {
            case "EXACT":
                return <ArrowLeftRight className="w-4 h-4" />;
            case "RELATED":
                return <GitBranch className="w-4 h-4" />;
            case "SUBSET":
                return <Layers className="w-4 h-4" />;
            case "LINK":
                return <LinkIcon className="w-4 h-4" />;
            default:
                return <ArrowRight className="w-4 h-4" />;
        }
    };

    const getRelationColor = (code: string) => {
        switch (code) {
            case "EXACT":
                return "bg-green-500/10 text-green-600 dark:text-green-400";
            case "RELATED":
                return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
            case "SUBSET":
                return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
            case "LINK":
                return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
            default:
                return "bg-muted text-muted-foreground";
        }
    };

    return (
        <div className="h-full flex flex-col p-6">
            {showGraph ? (
                <GlossaryModelGraph
                    glossaryEntity={glossaryEntity}
                    metaFields={metaFields}
                    relations={relations}
                    onBack={() => onShowGraphChange(false)}
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
                    {/* Left Panel - Glossary Terms List */}
                    <Card className="p-4 lg:col-span-1 flex flex-col min-h-0 h-full">
                        <div className="flex-none mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-primary" />
                                    Glossary Terms
                                </h3>
                                <div className="flex items-center gap-1">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Relation Types Legend">
                                                <Info className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-4" align="start">
                                            <div className="space-y-3">
                                                <h4 className="font-medium leading-none">Relation Types</h4>
                                                <div className="grid gap-2">
                                                    {relationTypes.map((rt) => (
                                                        <div key={rt.id} className="flex items-start gap-2 text-sm">
                                                            <Badge className={`mt-0.5 ${getRelationColor(rt.id)}`}>
                                                                {getRelationIcon(rt.id)}
                                                            </Badge>
                                                            <div>
                                                                <span className="font-medium block">{rt.short_description}</span>
                                                                <span className="text-muted-foreground text-xs">{rt.description}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="View Graph" onClick={() => onShowGraphChange(true)}>
                                        <Network className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder="Search glossary terms..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {filteredGlossary.map((term) => {
                                const count = relationCounts[term.id] || 0;
                                return (
                                    <div
                                        key={term.id}
                                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedGlossary === term.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                            }`}
                                        onClick={() => setSelectedGlossary(term.id)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1 overflow-hidden">
                                                        <span className="font-medium text-sm truncate">{term.name}</span>
                                                        {getRelationBadges(term.id)}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono mt-1 w-full truncate">
                                                    {term.alias || term.id}
                                                </div>
                                            </div>
                                            {selectedGlossary === term.id && (
                                                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredGlossary.length === 0 && (
                                <div className="text-center text-muted-foreground py-4 text-sm">No terms found</div>
                            )}
                        </div>
                    </Card>

                    {/* Right Panel - Relations Details */}
                    <Card className="p-6 lg:col-span-2 h-full flex flex-col min-h-0">
                        {selectedGlossary ? (
                            <div className="flex flex-col h-full space-y-6">
                                {/* Selected Glossary Header */}
                                <div className="flex items-start justify-between flex-none">
                                    <div>
                                        <h3 className="text-2xl font-bold">
                                            {selectedGlossaryData?.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground font-mono mt-1">
                                            {selectedGlossaryData?.alias || selectedGlossary}
                                        </p>
                                        <p className="text-muted-foreground mt-2 text-sm line-clamp-2">
                                            {selectedGlossaryData?.description || "No description"}
                                        </p>
                                    </div>
                                    <Button onClick={() => setIsAddRelationOpen(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Relation
                                    </Button>
                                </div>

                                {/* Relations Table */}
                                <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                                    <h4 className="text-lg font-semibold mb-4 flex-none">Semantic Relations</h4>
                                    <div className="flex-1 overflow-auto border rounded-md">
                                        {relationsLoading ? (
                                            <div className="flex items-center justify-center h-full">
                                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : glossaryRelations.length > 0 ? (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Relation Type</TableHead>
                                                        <TableHead>Related Term</TableHead>
                                                        <TableHead>Context / Subject Area / Entity</TableHead>
                                                        <TableHead className="w-[80px]">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {glossaryRelations.map((relation) => {
                                                        const relType = getRelationType(relation.relationTypeCode);
                                                        return (
                                                            <TableRow key={relation.id}>
                                                                <TableCell>
                                                                    <Badge
                                                                        className={getRelationColor(relation.relationTypeCode)}
                                                                    >
                                                                        {getRelationIcon(relation.relationTypeCode)}
                                                                        <span className="ml-1">
                                                                            {relType?.short_description}
                                                                        </span>
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {relation.related_meta?.name}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {relation.related_meta?.description}
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-col gap-0.5 text-sm">
                                                                        <div className="font-medium text-foreground">
                                                                            {relation.related_entity?.subjectarea?.namespace?.name}
                                                                        </div>
                                                                        <div className="text-muted-foreground text-xs flex items-center gap-1">
                                                                            <span>/</span>
                                                                            <span>{relation.related_entity?.subjectarea?.name}</span>
                                                                            <span>/</span>
                                                                            <span className="font-medium text-foreground/80">{relation.related_entity?.name}</span>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteRelation(relation.id)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                                <GitBranch className="w-12 h-12 text-muted-foreground mb-3 opacity-20" />
                                                <p className="text-muted-foreground">
                                                    No relations defined yet
                                                </p>
                                                <Button
                                                    onClick={() => setIsAddRelationOpen(true)}
                                                    variant="outline"
                                                    className="mt-4"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Add First Relation
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center max-w-sm">
                                    <GitBranch className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                                    <h3 className="text-xl font-semibold mb-2">
                                        Select a Glossary Term
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Choose a term from the left panel to view and manage its semantic
                                        relations
                                    </p>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* Add Relation Dialog */}
            <Dialog open={isAddRelationOpen} onOpenChange={setIsAddRelationOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add Semantic Relation</DialogTitle>
                        <DialogDescription>
                            Define a relationship between{" "}
                            <span className="font-semibold text-foreground">
                                {selectedGlossaryData?.name}
                            </span>{" "}
                            and another glossary term.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Relation Type</label>
                            <Select
                                value={newRelationType}
                                onValueChange={setNewRelationType}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select relation type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {relationTypes.map((rt) => (
                                        <SelectItem key={rt.id} value={rt.id}>
                                            <div className="flex items-center gap-2">
                                                {getRelationIcon(rt.id)}
                                                <span>{rt.short_description}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {newRelationType && (
                                <p className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
                                    {
                                        relationTypes.find((rt) => rt.id === newRelationType)
                                            ?.description
                                    }
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Related Glossary Term
                            </label>
                            <GlossaryTermCascadingSelect
                                value={newRelatedMeta?.id}
                                onSelect={(entity, meta) => {
                                    setNewRelatedEntity(entity);
                                    setNewRelatedMeta(meta);
                                }}
                                excludeEntityId={glossaryEntity.id} // Optional: prevent self-reference if desired, though linking to self might be valid for some cases, usually not semantic relation
                                placeholder="Select a related term..."
                            />
                            {newRelatedMeta && (
                                <div className="text-sm border rounded-md p-2 bg-muted/50 mt-2">
                                    <div className="font-medium text-xs text-muted-foreground mb-1">Selected:</div>
                                    <div className="flex items-center gap-2">
                                        <Layers className="w-3 h-3 text-primary" />
                                        <span className="font-medium">{newRelatedMeta.name}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 ml-5">
                                        via {newRelatedEntity?.name}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsAddRelationOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAddRelation} disabled={!newRelationType || !newRelatedMeta || isAddingRequest}>
                            {isAddingRequest && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Add Relation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
