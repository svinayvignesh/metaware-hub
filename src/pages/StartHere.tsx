import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, BarChart3, Database } from "lucide-react";

export default function StartHere() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to MetaWare</h1>
        <p className="text-lg text-muted-foreground">
          Your comprehensive metadata management platform. Get started with the essentials below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Dashboard Overview</CardTitle>
            </div>
            <CardDescription>
              Get insights into your metadata landscape with comprehensive analytics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              View Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Metadata Management</CardTitle>
            </div>
            <CardDescription>
              Organize and manage your data assets with namespaces, entities, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Explore Metadata
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle>Documentation</CardTitle>
            </div>
            <CardDescription>
              Learn how to effectively use MetaWare for your data management needs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Read Docs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-primary-subtle border-primary/20">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get you started with your metadata management.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
            <div>
              <p className="font-medium">Create New Namespace</p>
              <p className="text-sm text-muted-foreground">Organize your data with logical boundaries</p>
            </div>
            <Button size="sm">Create</Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
            <div>
              <p className="font-medium">Import Data Schema</p>
              <p className="text-sm text-muted-foreground">Upload existing data definitions</p>
            </div>
            <Button size="sm">Import</Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
            <div>
              <p className="font-medium">Configure Data Sources</p>
              <p className="text-sm text-muted-foreground">Connect your databases and systems</p>
            </div>
            <Button size="sm">Configure</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}