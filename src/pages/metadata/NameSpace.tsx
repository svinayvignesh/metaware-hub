import { DataTable, Column, TableData } from "@/components/table/DataTable";

// Mock data for namespace - will be replaced with GraphQL API
const mockColumns: Column[] = [
  { key: 'name', title: 'Name', type: 'text' },
  { key: 'description', title: 'Description', type: 'text' },
  { key: 'owner', title: 'Owner', type: 'text' },
  { key: 'created_date', title: 'Created Date', type: 'date' },
  { key: 'status', title: 'Status', type: 'text' },
];

const mockData: TableData[] = [
  {
    id: '1',
    name: 'customer_data',
    description: 'Customer related data entities',
    owner: 'John Smith',
    created_date: '2024-01-15',
    status: 'Active',
  },
  {
    id: '2',
    name: 'product_catalog',
    description: 'Product and inventory information',
    owner: 'Sarah Johnson',
    created_date: '2024-01-20',
    status: 'Active',
  },
  {
    id: '3',
    name: 'financial_reporting',
    description: 'Financial and accounting data',
    owner: 'Mike Brown',
    created_date: '2024-01-25',
    status: 'Draft',
    _status: 'draft',
  },
];

export default function NameSpace() {
  const handleAdd = (newRow: Partial<TableData>) => {
    console.log('Add namespace:', newRow);
    // API call will be added here
  };

  const handleEdit = (id: string, updatedData: Partial<TableData>) => {
    console.log('Edit namespace:', id, updatedData);
    // API call will be added here
  };

  const handleDelete = (ids: string[]) => {
    console.log('Delete namespaces:', ids);
    // API call will be added here
  };

  const handleSave = (data: TableData[]) => {
    console.log('Save namespaces:', data);
    // API call will be added here
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">NameSpace Management</h1>
        <p className="text-muted-foreground">
          Manage logical boundaries and organize your data entities
        </p>
      </div>

      <DataTable
        columns={mockColumns}
        data={mockData}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSave={handleSave}
      />
    </div>
  );
}