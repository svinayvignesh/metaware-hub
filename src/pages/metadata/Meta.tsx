import { useState } from "react";
import { DataTable, Column, TableData } from "@/components/table/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Mock data for dropdowns - will be replaced with GraphQL API
const mockNamespaces = [
  { id: '1', name: 'customer_data', label: 'Customer Data' },
  { id: '2', name: 'product_catalog', label: 'Product Catalog' },
  { id: '3', name: 'financial_reporting', label: 'Financial Reporting' },
];

const mockSubjectAreas = {
  '1': [
    { id: '1_1', name: 'customer_profile', label: 'Customer Profile' },
    { id: '1_2', name: 'customer_interaction', label: 'Customer Interaction' },
  ],
  '2': [
    { id: '2_1', name: 'product_inventory', label: 'Product Inventory' },
    { id: '2_2', name: 'product_pricing', label: 'Product Pricing' },
  ],
  '3': [
    { id: '3_1', name: 'financial_transactions', label: 'Financial Transactions' },
    { id: '3_2', name: 'financial_reporting', label: 'Financial Reporting' },
  ],
};

const mockEntities = {
  '1_1': [
    { id: '1_1_1', name: 'customer', label: 'Customer' },
    { id: '1_1_2', name: 'customer_address', label: 'Customer Address' },
  ],
  '2_1': [
    { id: '2_1_1', name: 'product', label: 'Product' },
    { id: '2_1_2', name: 'inventory', label: 'Inventory' },
  ],
  '3_1': [
    { id: '3_1_1', name: 'transaction', label: 'Transaction' },
    { id: '3_1_2', name: 'payment', label: 'Payment' },
  ],
};

// Mock meta columns for the selected entity
const mockMetaColumns: Column[] = [
  { key: 'field_name', title: 'Field Name', type: 'text' },
  { key: 'data_type', title: 'Data Type', type: 'text' },
  { key: 'is_nullable', title: 'Nullable', type: 'text' },
  { key: 'default_value', title: 'Default Value', type: 'text' },
  { key: 'description', title: 'Description', type: 'text' },
  { key: 'business_rules', title: 'Business Rules', type: 'text' },
];

const mockMetaData: TableData[] = [
  {
    id: '1',
    field_name: 'customer_id',
    data_type: 'INTEGER',
    is_nullable: 'NO',
    default_value: 'AUTO_INCREMENT',
    description: 'Unique identifier for customer',
    business_rules: 'Primary key, auto-generated',
  },
  {
    id: '2',
    field_name: 'first_name',
    data_type: 'VARCHAR(100)',
    is_nullable: 'NO',
    default_value: '',
    description: 'Customer first name',
    business_rules: 'Required field, max 100 characters',
  },
  {
    id: '3',
    field_name: 'email',
    data_type: 'VARCHAR(255)',
    is_nullable: 'YES',
    default_value: '',
    description: 'Customer email address',
    business_rules: 'Must be valid email format if provided',
  },
];

export default function Meta() {
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [selectedSubjectArea, setSelectedSubjectArea] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<string>('');

  const availableSubjectAreas = selectedNamespace ? mockSubjectAreas[selectedNamespace as keyof typeof mockSubjectAreas] || [] : [];
  const availableEntities = selectedSubjectArea ? mockEntities[selectedSubjectArea as keyof typeof mockEntities] || [] : [];

  const handleNamespaceChange = (value: string) => {
    setSelectedNamespace(value);
    setSelectedSubjectArea('');
    setSelectedEntity('');
  };

  const handleSubjectAreaChange = (value: string) => {
    setSelectedSubjectArea(value);
    setSelectedEntity('');
  };

  const handleAdd = (newRow: Partial<TableData>) => {
    console.log('Add meta field:', newRow);
  };

  const handleEdit = (id: string, updatedData: Partial<TableData>) => {
    console.log('Edit meta field:', id, updatedData);
  };

  const handleDelete = (ids: string[]) => {
    console.log('Delete meta fields:', ids);
  };

  const handleSave = (data: TableData[]) => {
    console.log('Save meta fields:', data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meta Data Management</h1>
        <p className="text-muted-foreground">
          Explore field-level metadata for entities within your data landscape
        </p>
      </div>

      {/* Cascading Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="namespace">NameSpace</Label>
          <Select onValueChange={handleNamespaceChange} value={selectedNamespace}>
            <SelectTrigger>
              <SelectValue placeholder="Select namespace..." />
            </SelectTrigger>
            <SelectContent>
              {mockNamespaces.map((namespace) => (
                <SelectItem key={namespace.id} value={namespace.id}>
                  {namespace.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject-area">Subject Area</Label>
          <Select 
            onValueChange={handleSubjectAreaChange} 
            value={selectedSubjectArea}
            disabled={!selectedNamespace}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subject area..." />
            </SelectTrigger>
            <SelectContent>
              {availableSubjectAreas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="entity">Entity</Label>
          <Select 
            onValueChange={setSelectedEntity} 
            value={selectedEntity}
            disabled={!selectedSubjectArea}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select entity..." />
            </SelectTrigger>
            <SelectContent>
              {availableEntities.map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Entity Meta Table */}
      {selectedEntity && (
        <div className="space-y-4">
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Entity Metadata: {availableEntities.find(e => e.id === selectedEntity)?.label}
            </h2>
            <p className="text-muted-foreground mb-4">
              Field-level metadata and business rules for the selected entity
            </p>
          </div>

          <DataTable
            columns={mockMetaColumns}
            data={mockMetaData}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSave={handleSave}
          />
        </div>
      )}

      {!selectedEntity && selectedSubjectArea && (
        <div className="text-center py-8 text-muted-foreground">
          Please select an entity to view its metadata
        </div>
      )}

      {!selectedSubjectArea && selectedNamespace && (
        <div className="text-center py-8 text-muted-foreground">
          Please select a subject area to continue
        </div>
      )}

      {!selectedNamespace && (
        <div className="text-center py-8 text-muted-foreground">
          Please select a namespace to begin exploring metadata
        </div>
      )}
    </div>
  );
}