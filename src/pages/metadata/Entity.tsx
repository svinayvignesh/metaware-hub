import { DataTable, Column, TableData } from "@/components/table/DataTable";

const mockColumns: Column[] = [
  { key: 'name', title: 'Entity Name', type: 'text' },
  { key: 'subject_area', title: 'Subject Area', type: 'text' },
  { key: 'namespace', title: 'NameSpace', type: 'text' },
  { key: 'table_name', title: 'Physical Table', type: 'text' },
  { key: 'record_count', title: 'Record Count', type: 'number' },
  { key: 'last_updated', title: 'Last Updated', type: 'date' },
  { key: 'status', title: 'Status', type: 'text' },
];

const mockData: TableData[] = [
  {
    id: '1',
    name: 'Customer',
    subject_area: 'Customer Profile',
    namespace: 'customer_data',
    table_name: 'customers',
    record_count: 150000,
    last_updated: '2024-01-28',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Customer Address',
    subject_area: 'Customer Profile',
    namespace: 'customer_data',
    table_name: 'customer_addresses',
    record_count: 180000,
    last_updated: '2024-01-28',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Product',
    subject_area: 'Product Inventory',
    namespace: 'product_catalog',
    table_name: 'products',
    record_count: 25000,
    last_updated: '2024-01-27',
    status: 'Active',
  },
  {
    id: '4',
    name: 'Order Line Item',
    subject_area: 'Financial Transactions',
    namespace: 'financial_reporting',
    table_name: 'order_line_items',
    record_count: 500000,
    last_updated: '2024-01-28',
    status: 'Schema Change Pending',
    _status: 'edited',
  },
];

export default function Entity() {
  const handleAdd = (newRow: Partial<TableData>) => {
    console.log('Add entity:', newRow);
  };

  const handleEdit = (id: string, updatedData: Partial<TableData>) => {
    console.log('Edit entity:', id, updatedData);
  };

  const handleDelete = (ids: string[]) => {
    console.log('Delete entities:', ids);
  };

  const handleSave = (data: TableData[]) => {
    console.log('Save entities:', data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Entity Management</h1>
        <p className="text-muted-foreground">
          Manage data entities and their physical table mappings
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