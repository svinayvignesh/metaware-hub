import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";

export default function Admin() {
  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Admin</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground">
          System administration and user management
        </p>
      </div>
      
      <div className="text-center py-12 text-muted-foreground">
        <p>Admin functionality will be implemented here.</p>
        <p className="text-sm mt-2">This will include user management, system settings, and configuration options.</p>
      </div>
    </div>
  );
}