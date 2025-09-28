import { DataTable, Column, TableData } from "@/components/table/DataTable";

const mockColumns: Column[] = [
  { key: 'name', title: 'Subject Area Name', type: 'text' },
  { key: 'namespace', title: 'NameSpace', type: 'text' },
  { key: 'description', title: 'Description', type: 'text' },
  { key: 'domain_expert', title: 'Domain Expert', type: 'text' },
  { key: 'entity_count', title: 'Entity Count', type: 'number' },
  { key: 'status', title: 'Status', type: 'text' },
];

const mockData: TableData[] = [
  {
    id: '1',
    name: 'Customer Profile',
    namespace: 'customer_data',
    description: 'Customer personal and contact information',
    domain_expert: 'Alice Cooper',
    entity_count: 5,
    status: 'Active',
  },
  {
    id: '2',
    name: 'Product Inventory',
    namespace: 'product_catalog',
    description: 'Product stock and availability data',
    domain_expert: 'Bob Wilson',
    entity_count: 8,
    status: 'Active',
  },
  {
    id: '3',
    name: 'Financial Transactions',
    namespace: 'financial_reporting',
    description: 'Transaction and payment records',
    domain_expert: 'Carol Davis',
    entity_count: 12,
    status: 'Review',
    _status: 'edited',
  },
];

export default function SubjectArea() {
  const handleAdd = (newRow: Partial<TableData>) => {
    console.log('Add subject area:', newRow);
  };

  const handleEdit = (id: string, updatedData: Partial<TableData>) => {
    console.log('Edit subject area:', id, updatedData);
  };

  const handleDelete = (ids: string[]) => {
    console.log('Delete subject areas:', ids);
  };

  const handleSave = (data: TableData[]) => {
    console.log('Save subject areas:', data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subject Area Management</h1>
        <p className="text-muted-foreground">
          Organize related entities within logical business domains
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