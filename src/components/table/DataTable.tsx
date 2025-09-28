import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  Search,
  Filter,
  Maximize,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column {
  key: string;
  title: string;
  type?: 'text' | 'number' | 'date';
}

export interface TableData {
  id: string;
  [key: string]: any;
  _status?: 'draft' | 'edited' | 'normal';
}

interface DataTableProps {
  columns: Column[];
  data: TableData[];
  onAdd?: (newRow: Partial<TableData>) => void;
  onEdit?: (id: string, updatedData: Partial<TableData>) => void;
  onDelete?: (ids: string[]) => void;
  onSave?: (data: TableData[]) => void;
  className?: string;
}

export const DataTable = ({
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  onSave,
  className,
}: DataTableProps) => {
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [editedData, setEditedData] = useState<TableData[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const filteredData = useMemo(() => {
    const dataToFilter = editMode ? editedData : data;
    if (!searchTerm) return dataToFilter;
    
    return dataToFilter.filter((row) =>
      columns.some((col) =>
        String(row[col.key])
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    );
  }, [data, editedData, searchTerm, editMode, columns]);

  const handleEditMode = () => {
    if (editMode) {
      setEditedData([]);
    } else {
      setEditedData([...data]);
    }
    setEditMode(!editMode);
  };

  const handleSave = () => {
    onSave?.(editedData);
    setEditMode(false);
    setEditedData([]);
  };

  const handleAddRow = () => {
    const newRow: TableData = {
      id: `new_${Date.now()}`,
      _status: 'draft',
      ...columns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {}),
    };
    
    if (editMode) {
      setEditedData(prev => [...prev, newRow]);
    } else {
      onAdd?.(newRow);
    }
  };

  const handleCellEdit = (id: string, key: string, value: string) => {
    setEditedData(prev =>
      prev.map(row =>
        row.id === id
          ? { ...row, [key]: value, _status: row._status === 'draft' ? 'draft' : 'edited' }
          : row
      )
    );
  };

  const handleDelete = () => {
    if (selectedRows.length > 0) {
      onDelete?.(selectedRows);
      setSelectedRows([]);
    }
  };

  const getRowClassName = (row: TableData) => {
    switch (row._status) {
      case 'draft':
        return 'bg-table-row-draft border-warning/30';
      case 'edited':
        return 'bg-table-row-edited border-primary/30';
      default:
        return 'hover:bg-table-row-hover';
    }
  };

  return (
    <div className={cn(
      "space-y-4",
      isFullscreen && "fixed inset-0 z-50 bg-background p-6",
      className
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={handleEditMode}
          >
            <Edit className="h-4 w-4 mr-2" />
            {editMode ? "Exit Edit" : "Edit"}
          </Button>
          
          {editMode && (
            <Button variant="default" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={handleAddRow}>
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
          
          {selectedRows.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedRows.length})
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader className="bg-table-header">
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                  onChange={(e) =>
                    setSelectedRows(
                      e.target.checked ? filteredData.map(row => row.id) : []
                    )
                  }
                />
              </TableHead>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.title}</TableHead>
              ))}
              <TableHead className="w-20">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row) => (
              <TableRow
                key={row.id}
                className={getRowClassName(row)}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id)}
                    onChange={(e) =>
                      setSelectedRows(prev =>
                        e.target.checked
                          ? [...prev, row.id]
                          : prev.filter(id => id !== row.id)
                      )
                    }
                  />
                </TableCell>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {editMode ? (
                      <Input
                        value={row[column.key] || ''}
                        onChange={(e) => handleCellEdit(row.id, column.key, e.target.value)}
                        className="h-8"
                      />
                    ) : (
                      <span className={searchTerm && String(row[column.key]).toLowerCase().includes(searchTerm.toLowerCase())
                        ? "bg-yellow-200 dark:bg-yellow-900 px-1 rounded"
                        : ""
                      }>
                        {row[column.key]}
                      </span>
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  {row._status && (
                    <Badge
                      variant={
                        row._status === 'draft' ? 'secondary' :
                        row._status === 'edited' ? 'default' : 'outline'
                      }
                    >
                      {row._status}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="text-sm text-muted-foreground">
        Total rows: {filteredData.length}
        {searchTerm && ` (filtered from ${data.length})`}
      </div>
    </div>
  );
};