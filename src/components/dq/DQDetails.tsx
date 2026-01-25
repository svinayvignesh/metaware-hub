import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft,
    Search,
    CheckCircle2,
    XCircle,
    AlertCircle,
    BarChart3,
    Loader2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GET_DQ_DETAILS, type DQDetailsResponse, type DQResult } from "@/graphql/queries/dqresult";

interface DQDetailsProps {
    executionId: string;
    entityContext: {
        ns: string;
        sa: string;
        en: string;
    };
    onBack: () => void;
}

interface RuleWithScore {
    id: string;
    column: string;
    rule: string;
    dimension: string;
    status: "passed" | "warning" | "failed" | "error";
    score: number;
    description: string;
    ruleId: string;
}

export const DQDetails: React.FC<DQDetailsProps> = ({
    executionId,
    entityContext,
    onBack,
}) => {
    const [selectedRule, setSelectedRule] = useState<RuleWithScore | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const { data, loading, error } = useQuery<DQDetailsResponse>(GET_DQ_DETAILS, {
        variables: { executionId },
        fetchPolicy: "network-only",
    });

    // Transform DQ results into rules list
    const rules: RuleWithScore[] = React.useMemo(() => {
        if (!data?.dq_result) return [];

        return data.dq_result.map((result, idx) => {
            const passed = result.rowsPassed || 0;
            const total = result.rowsEvaluated || 0;
            const score = total > 0 ? (passed / total) * 100 : 0;

            let status: "passed" | "warning" | "failed" | "error" = "passed";
            if (result.status === "error") status = "error";
            else if (score < 90) status = "failed";
            else if (score < 98) status = "warning";

            return {
                id: result.id,
                column: result.metaColumn,
                rule: result.ruleName,
                dimension: result.ruleSubtype,
                status,
                score,
                description: result.execution?.ruleset?.rules?.find(r => r.id === result.ruleId)?.description || result.ruleName,
                ruleId: result.ruleId,
            };
        });
    }, [data]);

    // Get profile data for selected rule
    const selectedProfile = React.useMemo(() => {
        if (!selectedRule || !data?.dq_result) return null;

        const result = data.dq_result.find(r => r.id === selectedRule.id);
        if (!result?.execution?.profiles) return null;

        return result.execution.profiles.find(p => p.columnName === selectedRule.column);
    }, [selectedRule, data]);

    // Parse top values from profile
    const topValues = React.useMemo(() => {
        if (!selectedProfile?.topValues) return [];

        try {
            const parsed = JSON.parse(selectedProfile.topValues);
            return Object.entries(parsed).map(([value, count]) => ({
                value,
                count: count as number,
                percentage: selectedProfile.totalRows ? ((count as number) / selectedProfile.totalRows) * 100 : 0,
            }));
        } catch {
            return [];
        }
    }, [selectedProfile]);

    // Parse patterns from profile
    const patterns = React.useMemo(() => {
        if (!selectedProfile?.patterns) return [];

        try {
            const parsed = JSON.parse(selectedProfile.patterns);
            return Object.entries(parsed).map(([pattern, data]: [string, any]) => ({
                pattern,
                example: data.example || "",
                count: data.count || 0,
                percentage: selectedProfile.totalRows ? (data.count / selectedProfile.totalRows) * 100 : 0,
            }));
        } catch {
            return [];
        }
    }, [selectedProfile]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "passed":
                return <CheckCircle2 className="w-4 h-4 text-green-600" />;
            case "warning":
                return <AlertCircle className="w-4 h-4 text-yellow-600" />;
            case "failed":
            case "error":
                return <XCircle className="w-4 h-4 text-red-600" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string, score: number) => {
        const variant =
            status === "passed"
                ? "default"
                : status === "warning"
                    ? "secondary"
                    : "destructive";

        return (
            <div className="flex items-center gap-2">
                {getStatusIcon(status)}
                <Badge variant={variant} className="font-semibold">
                    {score.toFixed(1)}%
                </Badge>
            </div>
        );
    };

    const filteredRules = rules.filter(
        (rule) =>
            rule.column.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rule.rule.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading DQ Details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                    <XCircle className="h-12 w-12 mx-auto text-destructive opacity-50" />
                    <p className="font-medium text-foreground">Failed to load DQ Details</p>
                    <p className="text-sm text-muted-foreground">{error.message}</p>
                    <Button variant="outline" onClick={onBack}>
                        Back to Table
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* 3-Panel Layout */}
            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 p-4">
                {/* Left Panel - Rules List */}
                <div className="col-span-3">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">DQ Rules</CardTitle>
                            <div className="relative mt-2">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search rules..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0">
                            <ScrollArea className="h-full">
                                <div className="space-y-1 p-4 pt-0">
                                    {filteredRules.map((rule) => (
                                        <div
                                            key={rule.id}
                                            className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedRule?.id === rule.id
                                                ? "bg-primary/10 border-2 border-primary"
                                                : "bg-muted/50 hover:bg-muted border-2 border-transparent"
                                                }`}
                                            onClick={() => setSelectedRule(rule)}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="font-medium text-sm">{rule.column}</div>
                                                {getStatusIcon(rule.status)}
                                            </div>
                                            <div className="text-xs text-muted-foreground mb-2">
                                                {rule.rule}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline" className="text-xs">
                                                    {rule.dimension}
                                                </Badge>
                                                <span className="text-xs font-semibold">
                                                    {rule.score.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredRules.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No rules found
                                        </p>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel - Rule Details */}
                <div className="col-span-9">
                    <div className="grid grid-rows-2 gap-6 h-full">
                        {/* Top Right - Details with Tabs */}
                        <Card className="overflow-hidden">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl">
                                            {selectedRule?.column || "Select a rule"}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {selectedRule?.description}
                                        </p>
                                    </div>
                                    {selectedRule && getStatusBadge(selectedRule.status, selectedRule.score)}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {selectedRule ? (
                                    <Tabs defaultValue="values" className="w-full">
                                        <TabsList className="grid w-full grid-cols-4">
                                            <TabsTrigger value="values">Values</TabsTrigger>
                                            <TabsTrigger value="patterns">Patterns</TabsTrigger>
                                            <TabsTrigger value="statistics">Statistics</TabsTrigger>
                                            <TabsTrigger value="details">Rule Details</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="values" className="mt-4">
                                            <ScrollArea className="h-[280px]">
                                                {selectedProfile && topValues.length > 0 ? (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Value</TableHead>
                                                                <TableHead className="text-right">Count</TableHead>
                                                                <TableHead className="text-right">Distribution</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {topValues.map((item, idx) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell className="font-mono font-medium">
                                                                        {item.value}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {item.count.toLocaleString()}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                                                                <div
                                                                                    className="h-full bg-primary"
                                                                                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-sm font-medium">
                                                                                {item.percentage.toFixed(2)}%
                                                                            </span>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground text-center py-8">
                                                        {selectedProfile ? "No value distribution data available" : "No profile data available"}
                                                    </p>
                                                )}
                                            </ScrollArea>
                                        </TabsContent>

                                        <TabsContent value="patterns" className="mt-4">
                                            <ScrollArea className="h-[280px]">
                                                {selectedProfile && patterns.length > 0 ? (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Pattern</TableHead>
                                                                <TableHead>Example</TableHead>
                                                                <TableHead className="text-right">Count</TableHead>
                                                                <TableHead className="text-right">Percentage</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {patterns.map((pattern, idx) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell className="font-mono text-xs">
                                                                        {pattern.pattern}
                                                                    </TableCell>
                                                                    <TableCell className="text-muted-foreground">
                                                                        {pattern.example}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {pattern.count.toLocaleString()}
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-medium">
                                                                        {pattern.percentage.toFixed(2)}%
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground text-center py-8">
                                                        {selectedProfile ? "No pattern data available" : "No profile data available"}
                                                    </p>
                                                )}
                                            </ScrollArea>
                                        </TabsContent>

                                        <TabsContent value="statistics" className="mt-4">
                                            {selectedProfile ? (
                                                <div className="grid grid-cols-3 gap-4">
                                                    <Card>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-sm text-muted-foreground">
                                                                Total Rows
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="text-2xl font-bold">
                                                                {(selectedProfile.totalRows || 0).toLocaleString()}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-sm text-muted-foreground">
                                                                Null Count
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="text-2xl font-bold text-yellow-600">
                                                                {selectedProfile.nullCount || 0}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {((selectedProfile.nullPercentage || 0)).toFixed(2)}%
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-sm text-muted-foreground">
                                                                Unique Values
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="text-2xl font-bold text-blue-600">
                                                                {selectedProfile.uniqueValues || 0}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-sm text-muted-foreground">
                                                                Min Length
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="text-2xl font-bold">
                                                                {selectedProfile.minLength || "-"}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-sm text-muted-foreground">
                                                                Max Length
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="text-2xl font-bold">
                                                                {selectedProfile.maxLength || "-"}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-sm text-muted-foreground">
                                                                Avg Length
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="text-2xl font-bold">
                                                                {selectedProfile.avgLength?.toFixed(2) || "-"}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground text-center py-8">
                                                    No profile statistics available
                                                </p>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="details" className="mt-4">
                                            <ScrollArea className="h-[280px]">
                                                <div className="space-y-4">
                                                    {(() => {
                                                        const result = data?.dq_result?.find(r => r.id === selectedRule.id);
                                                        if (!result) return <p className="text-muted-foreground">No details available</p>;

                                                        return (
                                                            <>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <Card className="bg-muted/30">
                                                                        <CardHeader className="pb-2">
                                                                            <CardTitle className="text-xs uppercase text-muted-foreground">Expectation Type</CardTitle>
                                                                        </CardHeader>
                                                                        <CardContent>
                                                                            <p className="font-mono text-sm">{result.expectationType || "N/A"}</p>
                                                                        </CardContent>
                                                                    </Card>
                                                                    <Card className="bg-muted/30">
                                                                        <CardHeader className="pb-2">
                                                                            <CardTitle className="text-xs uppercase text-muted-foreground">Predicate SQL</CardTitle>
                                                                        </CardHeader>
                                                                        <CardContent>
                                                                            <p className="font-mono text-sm break-all">{result.predicateSql || "N/A"}</p>
                                                                        </CardContent>
                                                                    </Card>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <Card className="bg-green-500/10 border-green-200">
                                                                        <CardHeader className="pb-2">
                                                                            <CardTitle className="text-xs uppercase text-green-700">Expected Value</CardTitle>
                                                                        </CardHeader>
                                                                        <CardContent>
                                                                            <p className="font-mono text-sm">{result.expectedValue || "N/A"}</p>
                                                                        </CardContent>
                                                                    </Card>
                                                                    <Card className="bg-red-500/10 border-red-200">
                                                                        <CardHeader className="pb-2">
                                                                            <CardTitle className="text-xs uppercase text-red-700">Observed Value</CardTitle>
                                                                        </CardHeader>
                                                                        <CardContent>
                                                                            <p className="font-mono text-sm">{result.observedValue || "N/A"}</p>
                                                                        </CardContent>
                                                                    </Card>
                                                                </div>

                                                                {result.errorMessage && (
                                                                    <Card className="bg-destructive/10 border-destructive/20">
                                                                        <CardHeader className="pb-2">
                                                                            <CardTitle className="text-xs uppercase text-destructive">Error Message</CardTitle>
                                                                        </CardHeader>
                                                                        <CardContent>
                                                                            <p className="font-mono text-sm text-destructive">{result.errorMessage}</p>
                                                                        </CardContent>
                                                                    </Card>
                                                                )}

                                                                <Card>
                                                                    <CardHeader className="pb-2">
                                                                        <CardTitle className="text-xs uppercase text-muted-foreground">Result Details (JSON)</CardTitle>
                                                                    </CardHeader>
                                                                    <CardContent>
                                                                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[100px]">
                                                                            {result.resultDetails || "No additional details"}
                                                                        </pre>
                                                                    </CardContent>
                                                                </Card>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </ScrollArea>
                                        </TabsContent>
                                    </Tabs>
                                ) : (
                                    <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                                        <div className="text-center">
                                            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>Select a rule to view details</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Bottom Right - Execution Summary */}
                        <Card className="overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-lg">Execution Summary</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {data?.dq_result?.[0]?.execution?.targetTableFqn}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-4">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm text-muted-foreground">
                                                Total Rules
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {data?.dq_result?.[0]?.execution?.totalRules || 0}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm text-muted-foreground">
                                                Passed
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-green-600">
                                                {data?.dq_result?.[0]?.execution?.passedRules || 0}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm text-muted-foreground">
                                                Failed
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-red-600">
                                                {data?.dq_result?.[0]?.execution?.failedRules || 0}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm text-muted-foreground">
                                                Errors
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-orange-600">
                                                {data?.dq_result?.[0]?.execution?.errorRules || 0}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
