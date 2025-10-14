import { useState, useMemo } from "react";
import React from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
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
  Group,
  FilterX,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  entityType?: string;
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
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [groupByColumns, setGroupByColumns] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const editedData = externalEditedData !== undefined ? externalEditedData : internalEditedData;
  const setEditedData = onEditedDataChange || setInternalEditedData;

  const filteredData = useMemo(() => {
    const dataToFilter = editedData.length > 0 ? editedData : data;
    let filtered = dataToFilter;
    
    if (searchTerm) {
      filtered = filtered.filter((row) =>
        columns.some((col) =>
          String(row[col.key])
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      );
    }
    
    Object.entries(columnFilters).forEach(([columnKey, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter((row) =>
          String(row[columnKey])
            .toLowerCase()
            .includes(filterValue.toLowerCase())
        );
      }
    });
    
    return filtered.sort((a, b) => {
      if (a._status === 'draft' && b._status !== 'draft') return -1;
      if (a._status !== 'draft' && b._status === 'draft') return 1;
      
      if (sortColumn) {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
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
  }, [data, editedData, searchTerm, columns, sortColumn, sortDirection, columnFilters]);

  const hasChanges = useMemo(() => {
    return editedData.length > 0 && (
      editedData.length !== data.length ||
      editedData.some(row => row._status === 'draft' || row._status === 'edited')
    );
  }, [editedData, data]);

  // Recursive grouping function for multiple levels
  const createNestedGroups = (rows: TableData[], groupColumns: string[], level: number = 0): any => {
    if (groupColumns.length === 0 || level >= groupColumns.length) {
      return rows;
    }

    const currentGroupColumn = groupColumns[level];
    const grouped = rows.reduce((acc, row) => {
      const groupValue = String(row[currentGroupColumn] || 'Ungrouped');
      if (!acc[groupValue]) {
        acc[groupValue] = [];
      }
      acc[groupValue].push(row);
      return acc;
    }, {} as { [key: string]: TableData[] });

    const result: any = {};
    Object.entries(grouped).forEach(([key, values]) => {
      result[key] = createNestedGroups(values, groupColumns, level + 1);
    });

    return result;
  };

  const groupedData = useMemo(() => {
    return groupByColumns.length > 0
      ? createNestedGroups(filteredData, groupByColumns)
      : null;
  }, [filteredData, groupByColumns]);

  const handleEditMode = () => {
    if (editingRows.length > 0) {
      setEditingRows([]);
      setEditedData(prev => {
        const withoutDrafts = prev.filter(row => row._status !== 'draft');
        return withoutDrafts.map(row => {
          if (row._status === 'edited') {
            const original = data.find(d => d.id === row.id);
            return original ? { ...original } : row;
          }
          return row;
        });
      });
    } else if (selectedRows.length > 0) {
      setEditingRows(prev => [...prev, ...selectedRows.filter(id => !prev.includes(id))]);
      if (editedData.length === 0) setEditedData([...data]);
    } else {
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
    if (!validateRequiredFields(editedData)) {
      const requiredFieldNames = columns.filter(col => col.required).map(col => col.title).join(', ');
      alert(`Please fill in all required fields: ${requiredFieldNames}`);
      return;
    }

    setIsSaving(true);
    try {
      await onSave?.(editedData);
      
      const draftIds = editedData.filter(row => row._status === 'draft').map(row => row.id);
      setNewlyAddedIds(draftIds);
      
      setEditingRows([]);
      setEditedData([]);
      
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
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
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
    const headers = columns.map(col => col.title).join(',');
    const rows = filteredData.map(row => 
      columns.map(col => {
        const value = row[col.key];
        if (value == null) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    
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

  const clearAllFilters = () => {
    setColumnFilters({});
    setSearchTerm('');
  };

  const hasActiveFilters = Object.keys(columnFilters).length > 0 || searchTerm !== '';

  // Helper function to count total rows in nested structure
  const countRows = (data: any): number => {
    if (Array.isArray(data)) return data.length;
    return Object.values(data).reduce<number>((sum, val) => {
      return sum + countRows(val);
    }, 0);
  };

  // Recursive render function for nested groups
  const renderNestedGroups = (data: any, groupColumns: string[], level: number = 0, parentKey: string = ''): React.ReactNode => {
    if (Array.isArray(data)) {
      return data.map((row) => (
        <TableRow key={row.id} className={getRowClassName(row)}>
          <TableCell className="w-12">
            <Checkbox
              checked={selectedRows.includes(row.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedRows(prev => [...prev, row.id]);
                } else {
                  setSelectedRows(prev => prev.filter(id => id !== row.id));
                }
              }}
            />
          </TableCell>
          {columns.map((col, idx) => {
            const isEditing = editingRows.includes(row.id);
            const cellStyle = idx === 0 ? { paddingLeft: `${(level + 1) * 1.5}rem` } : {};
            
            return (
              <TableCell key={col.key} style={cellStyle}>
                {isEditing ? (
                  col.type === 'select' && col.options ? (
                    <Select
                      value={String(row[col.key] || '')}
                      onValueChange={(value) => handleCellEdit(row.id, col.key, value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {col.options.map((opt) => {
                          const value = typeof opt === 'string' ? opt : opt.value;
                          const label = typeof opt === 'string' ? opt : opt.label;
                          return (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  ) : col.type === 'checkbox' ? (
                    <Checkbox
                      checked={Boolean(row[col.key])}
                      onCheckedChange={(checked) => handleCellEdit(row.id, col.key, Boolean(checked))}
                    />
                  ) : col.renderCell ? (
                    col.renderCell(row, isEditing, (value) => handleCellEdit(row.id, col.key, value))
                  ) : (
                    <Input
                      type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                      value={String(row[col.key] || '')}
                      onChange={(e) => handleCellEdit(row.id, col.key, e.target.value)}
                      className="h-8"
                      required={col.required}
                    />
                  )
                ) : col.renderCell ? (
                  col.renderCell(row, isEditing, () => {})
                ) : col.type === 'checkbox' ? (
                  <Checkbox checked={Boolean(row[col.key])} disabled />
                ) : (
                  String(row[col.key] || '')
                )}
              </TableCell>
            );
          })}
        </TableRow>
      ));
    }

    return Object.entries(data).map(([groupValue, groupData]) => {
      const groupKey = `${parentKey}-${groupValue}`;
      const isExpanded = expandedGroups.has(groupKey);
      const rowCount = countRows(groupData);

      return (
        <React.Fragment key={groupKey}>
          <TableRow 
            className="bg-muted/30 font-semibold cursor-pointer hover:bg-muted/50"
            onClick={() => {
              setExpandedGroups(prev => {
                const newSet = new Set(prev);
                if (isExpanded) {
                  newSet.delete(groupKey);
                } else {
                  newSet.add(groupKey);
                }
                return newSet;
              });
            }}
          >
            <TableCell colSpan={columns.length + 1}>
              <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 1.5}rem` }}>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Group className="h-4 w-4" />
                <span className="text-xs text-muted-foreground mr-2">
                  {columns.find(c => c.key === groupColumns[level])?.title}:
                </span>
                {groupValue} <span className="text-muted-foreground">({rowCount})</span>
              </div>
            </TableCell>
          </TableRow>
          {isExpanded && renderNestedGroups(groupData, groupColumns, level + 1, groupKey)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className={cn(
      "space-y-4",
      isFullscreen && "fixed inset-0 z-50 bg-background p-6",
      className
    )}>
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
              placeholder="Search all columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Group className="h-4 w-4 mr-2" />
                Group By
                {groupByColumns.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {groupByColumns.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
              <div className="p-2 space-y-1">
                <div className="text-xs font-medium text-muted-foreground mb-2">Select columns to group by (in order)</div>
                {columns.map((col) => {
                  const isSelected = groupByColumns.includes(col.key);
                  const order = groupByColumns.indexOf(col.key);
                  return (
                    <div
                      key={col.key}
                      className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer"
                      onClick={() => {
                        if (isSelected) {
                          setGroupByColumns(prev => prev.filter(k => k !== col.key));
                        } else {
                          setGroupByColumns(prev => [...prev, col.key]);
                        }
                      }}
                    >
                      <span className="text-sm">{col.title}</span>
                      {isSelected && (
                        <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center">
                          {order + 1}
                        </Badge>
                      )}
                    </div>
                  );
                })}
                {groupByColumns.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setGroupByColumns([])}
                    >
                      Clear All
                    </Button>
                  </>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle column filters"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              title="Clear all filters"
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}
          
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

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-280px)]">
        <Table>
          <TableHeader className="bg-table-header sticky top-0 z-20 shadow-sm">
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRows(filteredData.map(row => row.id));
                    } else {
                      setSelectedRows([]);
                    }
                  }}
                />
              </TableHead>
              {columns.map((col) => (
                <TableHead key={col.key}>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort(col.key)}
                      >
                        {col.title}
                        {getSortIcon(col.key)}
                      </Button>
                    </div>
                    {showFilters && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-7 px-2 text-xs",
                              columnFilters[col.key] && "bg-primary/10 text-primary"
                            )}
                          >
                            <Filter className="h-3 w-3 mr-1" />
                            {columnFilters[col.key] ? 'Filtered' : 'Filter'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 bg-popover z-50" align="start">
                          <div className="space-y-2">
                            <Input
                              placeholder={`Filter ${col.title}...`}
                              value={columnFilters[col.key] || ''}
                              onChange={(e) => 
                                setColumnFilters(prev => ({
                                  ...prev,
                                  [col.key]: e.target.value
                                }))
                              }
                            />
                            {columnFilters[col.key] && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  setColumnFilters(prev => {
                                    const newFilters = { ...prev };
                                    delete newFilters[col.key];
                                    return newFilters;
                                  });
                                }}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Clear Filter
                              </Button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedData ? (
              renderNestedGroups(groupedData, groupByColumns)
            ) : (
              filteredData.map((row) => (
                <TableRow key={row.id} className={getRowClassName(row)}>
                  <TableCell className="w-12">
                    <Checkbox
                      checked={selectedRows.includes(row.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRows(prev => [...prev, row.id]);
                        } else {
                          setSelectedRows(prev => prev.filter(id => id !== row.id));
                        }
                      }}
                    />
                  </TableCell>
                  {columns.map((col) => {
                    const isEditing = editingRows.includes(row.id);
                    
                    return (
                      <TableCell key={col.key}>
                        {isEditing ? (
                          col.type === 'select' && col.options ? (
                            <Select
                              value={String(row[col.key] || '')}
                              onValueChange={(value) => handleCellEdit(row.id, col.key, value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-popover z-50">
                                {col.options.map((opt) => {
                                  const value = typeof opt === 'string' ? opt : opt.value;
                                  const label = typeof opt === 'string' ? opt : opt.label;
                                  return (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          ) : col.type === 'checkbox' ? (
                            <Checkbox
                              checked={Boolean(row[col.key])}
                              onCheckedChange={(checked) => handleCellEdit(row.id, col.key, Boolean(checked))}
                            />
                          ) : col.renderCell ? (
                            col.renderCell(row, isEditing, (value) => handleCellEdit(row.id, col.key, value))
                          ) : (
                            <Input
                              type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                              value={String(row[col.key] || '')}
                              onChange={(e) => handleCellEdit(row.id, col.key, e.target.value)}
                              className="h-8"
                              required={col.required}
                            />
                          )
                        ) : col.renderCell ? (
                          col.renderCell(row, isEditing, () => {})
                        ) : col.type === 'checkbox' ? (
                          <Checkbox checked={Boolean(row[col.key])} disabled />
                        ) : (
                          String(row[col.key] || '')
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30">
        <div className="text-sm text-muted-foreground">
          Total rows: <span className="font-medium text-foreground">{filteredData.length}</span>
          {filteredData.length !== data.length && (
            <span className="ml-2">
              (filtered from {data.length})
            </span>
          )}
        </div>
        {groupByColumns.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Grouped by: <span className="font-medium text-foreground">{groupByColumns.map(col => columns.find(c => c.key === col)?.title).join(' → ')}</span>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};
