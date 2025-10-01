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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  Search,
  Filter,
  Maximize,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export interface Column {
  key: string;
  title: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  options?: string[] | { value: string; label: string }[];
  renderCell?: (row: TableData, isEditing: boolean, onChange: (value: string) => void) => React.ReactNode;
  required?: boolean;
  onHeaderClick?: (columnKey: string) => void;
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
  entityType?: string; // e.g., "Namespace", "Subject Area", "Entity"
  externalEditedData?: TableData[];
  onEditedDataChange?: (data: TableData[]) => void;
}

export const DataTable = ({
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  onSave,
  className,
  entityType = "Row",
  externalEditedData,
  onEditedDataChange,
}: DataTableProps) => {
  const [editingRows, setEditingRows] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [internalEditedData, setInternalEditedData] = useState<TableData[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newlyAddedIds, setNewlyAddedIds] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Use external edited data if provided, otherwise use internal state
  const editedData = externalEditedData !== undefined ? externalEditedData : internalEditedData;
  const setEditedData = onEditedDataChange || setInternalEditedData;

  const filteredData = useMemo(() => {
    const dataToFilter = editedData.length > 0 ? editedData : data;
    let filtered = dataToFilter;
    
    if (searchTerm) {
      filtered = dataToFilter.filter((row) =>
        columns.some((col) =>
          String(row[col.key])
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Sort data
    return filtered.sort((a, b) => {
      // Always show draft rows at the top regardless of sorting
      if (a._status === 'draft' && b._status !== 'draft') return -1;
      if (a._status !== 'draft' && b._status === 'draft') return 1;
      
      // Apply column sorting if a column is selected
      if (sortColumn) {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        // Compare values
        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          comparison = aValue === bValue ? 0 : aValue ? -1 : 1;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });
  }, [data, editedData, searchTerm, columns, sortColumn, sortDirection]);

  const hasChanges = useMemo(() => {
    return editedData.length > 0 && (
      editedData.length !== data.length ||
      editedData.some(row => row._status === 'draft' || row._status === 'edited')
    );
  }, [editedData, data]);

  const handleEditMode = () => {
    if (editingRows.length > 0) {
      // Exit edit mode - revert all changes and remove draft rows
      setEditingRows([]);
      setEditedData(prev => {
        // Remove all draft rows
        const withoutDrafts = prev.filter(row => row._status !== 'draft');
        // Revert all edited rows to original data
        return withoutDrafts.map(row => {
          if (row._status === 'edited') {
            const original = data.find(d => d.id === row.id);
            return original ? { ...original } : row;
          }
          return row;
        });
      });
    } else if (selectedRows.length > 0) {
      // Enter edit mode for selected rows
      setEditingRows(prev => [...prev, ...selectedRows.filter(id => !prev.includes(id))]);
      if (editedData.length === 0) setEditedData([...data]);
    } else {
      // Enter edit mode for all rows
      setEditingRows(filteredData.map(row => row.id));
      if (editedData.length === 0) setEditedData([...data]);
    }
  };

  const validateRequiredFields = (data: TableData[]): boolean => {
    const requiredColumns = columns.filter(col => col.required);
    return data.every(row => {
      return requiredColumns.every(col => {
        const value = row[col.key];
        return value !== undefined && value !== null && String(value).trim() !== '';
      });
    });
  };

  const handleSave = async () => {
    // Validate required fields
    if (!validateRequiredFields(editedData)) {
      const requiredFieldNames = columns.filter(col => col.required).map(col => col.title).join(', ');
      alert(`Please fill in all required fields: ${requiredFieldNames}`);
      return;
    }

    setIsSaving(true);
    try {
      await onSave?.(editedData);
      
      // Store newly added IDs for animation
      const draftIds = editedData.filter(row => row._status === 'draft').map(row => row.id);
      setNewlyAddedIds(draftIds);
      
      // Clear states
      setEditingRows([]);
      setEditedData([]);
      
      // Clear animation after 3 seconds
      setTimeout(() => {
        setNewlyAddedIds([]);
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRow = () => {
    const newRow: TableData = {
      id: `new_${Date.now()}`,
      _status: 'draft',
      ...columns.reduce((acc, col) => ({ 
        ...acc, 
        [col.key]: col.type === 'checkbox' ? false : '' 
      }), {}),
    };
    
    // Add to local state and mark as editing
    if (editedData.length === 0) {
      setEditedData([...data, newRow]);
    } else {
      setEditedData(prev => [...prev, newRow]);
    }
    setEditingRows(prev => [...prev, newRow.id]);
  };

  const handleCellEdit = (id: string, key: string, value: string | boolean) => {
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

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      // Toggle direction or clear sort
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      // Sort by new column
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 ml-2 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-2" />
      : <ArrowDown className="h-4 w-4 ml-2" />;
  };

  const handleDownloadCSV = () => {
    // Convert data to CSV format
    const headers = columns.map(col => col.title).join(',');
    const rows = filteredData.map(row => 
      columns.map(col => {
        const value = row[col.key];
        // Handle values that contain commas or quotes
        if (value == null) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    
    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${entityType.toLowerCase().replace(/\s+/g, '_')}_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRowClassName = (row: TableData) => {
    const baseClasses = 'transition-all duration-200';
    const isNewlyAdded = newlyAddedIds.includes(row.id);
    
    switch (row._status) {
      case 'draft':
        return `bg-table-row-draft ${baseClasses}`;
      case 'edited':
        return `bg-table-row-edited ${baseClasses}`;
      default:
        if (isNewlyAdded) {
          return `bg-success/10 hover:bg-table-row-hover animate-fade-in ${baseClasses}`;
        }
        return `hover:bg-table-row-hover ${baseClasses}`;
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
            variant={editingRows.length > 0 ? "default" : "outline"}
            size="sm"
            onClick={handleEditMode}
          >
            <Edit className="h-4 w-4 mr-2" />
            {editingRows.length > 0 
              ? "Exit Edit" 
              : selectedRows.length > 0 
                ? `Edit ${selectedRows.length} row${selectedRows.length > 1 ? 's' : ''}` 
                : "Edit All"}
          </Button>
          
          {hasChanges && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleSave}
              disabled={isSaving}
              className="animate-fade-in"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddRow}
            className="transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {entityType}
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
            onClick={handleDownloadCSV}
            title="Download as CSV"
          >
            <Download className="h-4 w-4" />
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
      <div className="border rounded-lg overflow-y-auto max-h-[calc(100vh-280px)]">
        <Table>
          <TableHeader className="bg-table-header sticky top-0 z-20 shadow-sm">
            <TableRow>
              <TableHead className="w-12">
                <div onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSelectedRows(
                        e.target.checked ? filteredData.map(row => row.id) : []
                      );
                    }}
                  />
                </div>
              </TableHead>
              {columns.map((column) => (
                <TableHead 
                  key={column.key}
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={(e) => {
                    if (column.onHeaderClick) {
                      column.onHeaderClick(column.key);
                    } else {
                      handleSort(column.key);
                    }
                  }}
                >
                  <div className="flex items-center">
                    {column.title}
                    {!column.onHeaderClick && getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row) => {
              const isRowEditing = editingRows.includes(row.id) || row._status === 'draft' || row._status === 'edited';
              
              return (
                <TableRow
                  key={row.id}
                  className={cn(
                    getRowClassName(row),
                    row._status === 'draft' && "border-l-4 border-l-warning/70",
                    row._status === 'edited' && "border-l-4 border-l-primary/70",
                    !isRowEditing && "cursor-pointer"
                  )}
                  onClick={(e) => {
                    // Only toggle selection if not in edit mode and not clicking on interactive elements
                    if (!isRowEditing && !(e.target as HTMLElement).closest('input, button, select, a')) {
                      setSelectedRows(prev =>
                        prev.includes(row.id)
                          ? prev.filter(id => id !== row.id)
                          : [...prev, row.id]
                      );
                    }
                  }}
                >
                <TableCell className={cn(
                  row._status === 'draft' && "pl-2",
                  row._status === 'edited' && "pl-2"
                )}>
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        setSelectedRows(prev =>
                          e.target.checked
                            ? [...prev, row.id]
                            : prev.filter(id => id !== row.id)
                        );
                      }}
                    />
                  </div>
                </TableCell>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {(editingRows.includes(row.id) || row._status === 'draft' || row._status === 'edited') ? (
                      column.renderCell ? (
                        column.renderCell(row, true, (value) => handleCellEdit(row.id, column.key, value))
                      ) : column.type === 'checkbox' ? (
                        <Checkbox
                          checked={Boolean(row[column.key])}
                          onCheckedChange={(checked) => handleCellEdit(row.id, column.key, checked)}
                        />
                      ) : column.type === 'select' && column.options ? (
                        <Select
                          value={row[column.key] || ''}
                          onValueChange={(value) => handleCellEdit(row.id, column.key, value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder={`Select ${column.title}...`} />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
                            {column.options.map((option) => {
                              const value = typeof option === 'string' ? option : option.value;
                              const label = typeof option === 'string' ? option : option.label;
                              return (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={row[column.key] || ''}
                          onChange={(e) => handleCellEdit(row.id, column.key, e.target.value)}
                          className={cn("h-8", column.required && !row[column.key] && "border-destructive")}
                          placeholder={column.required ? `${column.title} (required)` : column.title}
                        />
                      )
                    ) : (
                      column.type === 'checkbox' ? (
                        <Checkbox
                          checked={Boolean(row[column.key])}
                          disabled
                        />
                      ) : (
                        <span className={searchTerm && String(row[column.key]).toLowerCase().includes(searchTerm.toLowerCase())
                          ? "bg-yellow-200 dark:bg-yellow-900 px-1 rounded"
                          : ""
                        }>
                          {column.renderCell ? column.renderCell(row, false, () => {}) : row[column.key]}
                        </span>
                      )
                    )}
                  </TableCell>
                ))}
              </TableRow>
              );
            })}
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