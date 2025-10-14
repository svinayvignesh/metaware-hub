import { useEffect, useState } from "react";
import { useMDConnection } from "@/hooks/useMDConnection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, CheckCircle, XCircle } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";

export default function DuckDBDemo() {
  const { connection, connect, ready, error } = useMDConnection();
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    connect();
  }, [connect]);

  const runTestQuery = async () => {
    if (!connection || !ready) return;

    setTesting(true);
    try {
      const result = await connection.evaluateQuery("SELECT 1 AS ok, 'Hello from MotherDuck' AS message;");
      
      if (result.type !== 'materialized') {
        throw new Error('Expected materialized result');
      }
      
      const rows = result.data.toRows();
      setTestResult(rows[0]);
    } catch (err) {
      console.error('Test query failed:', err);
      setTestResult({ error: err instanceof Error ? err.message : 'Query failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>DuckDB Demo</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Database className="h-8 w-8" />
            DuckDB + MotherDuck Demo
          </h1>
          <p className="text-muted-foreground mt-2">
            Browser-side DuckDB WASM with MotherDuck connection
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Connection Status
              {ready && <CheckCircle className="h-5 w-5 text-green-500" />}
              {error && <XCircle className="h-5 w-5 text-destructive" />}
              {!ready && !error && <Loader2 className="h-5 w-5 animate-spin" />}
            </CardTitle>
            <CardDescription>
              DuckDB WASM with MotherDuck extension
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              {ready ? (
                <Badge variant="default" className="bg-green-500">Connected</Badge>
              ) : error ? (
                <Badge variant="destructive">Error</Badge>
              ) : (
                <Badge variant="secondary">Connecting...</Badge>
              )}
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive font-medium">Error:</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            )}

            {ready && (
              <div className="space-y-3">
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    ✓ DB ready - MotherDuck connection established
                  </p>
                </div>

                <Button 
                  onClick={runTestQuery} 
                  disabled={testing}
                  className="w-full"
                >
                  {testing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Query...
                    </>
                  ) : (
                    "Run Test Query (SELECT 1)"
                  )}
                </Button>

                {testResult && (
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-2">Query Result:</p>
                    <pre className="text-xs bg-background p-3 rounded overflow-auto">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client:</span>
              <span className="font-mono">@motherduck/wasm-client</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">WASM Assets:</span>
              <span className="font-mono">app.motherduck.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mode:</span>
              <span className="font-mono">Browser WASM + MotherDuck Cloud</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
