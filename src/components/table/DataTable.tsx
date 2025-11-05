import { useState, useMemo, useRef, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  Loader2,
  RefreshCw,
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
  onRefresh?: () => void;
  className?: string;
  entityType?: string;
  externalEditedData?: TableData[];
  onEditedDataChange?: (data: TableData[]) => void;
  isDeleting?: boolean;
  isSaving?: boolean;
}

export const DataTable = ({
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  onSave,
  onRefresh,
  className,
  entityType = "Row",
  externalEditedData,
  onEditedDataChange,
  isDeleting: externalIsDeleting,
  isSaving: externalIsSaving,
}: DataTableProps) => {
  const [editingRows, setEditingRows] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [internalEditedData, setInternalEditedData] = useState<TableData[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newlyAddedIds, setNewlyAddedIds] = useState<string[]>([]);
  
  const isCurrentlySaving = externalIsSaving ?? isSaving;
  const isCurrentlyDeleting = externalIsDeleting ?? false;
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [groupByColumns, setGroupByColumns] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Virtual scrolling state
  const [windowStart, setWindowStart] = useState(0);
  const [windowEnd, setWindowEnd] = useState(150);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);
  
  const WINDOW_SIZE = 150;
  const LOAD_THRESHOLD = 100;

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
    
    // Create a copy before sorting to avoid mutation issues
    return [...filtered].sort((a, b) => {
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

  // Virtual scrolling: only render a window of data
  const visibleData = useMemo(() => {
    if (groupByColumns.length > 0) {
      // When grouping is active, show all data
      return filteredData;
    }
    return filteredData.slice(windowStart, windowEnd);
  }, [filteredData, windowStart, windowEnd, groupByColumns]);

  // Reset window when filters change
  useEffect(() => {
    setWindowStart(0);
    setWindowEnd(WINDOW_SIZE);
    isLoadingMore.current = false;
  }, [searchTerm, sortColumn, sortDirection, columnFilters, data, editedData]);

  // Handle scroll for infinite loading
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || groupByColumns.length > 0) return;

    const handleScroll = () => {
      if (isLoadingMore.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const scrolledRows = Math.floor(scrollTop / 40); // Approximate row height
      const isNearEnd = scrollTop + clientHeight >= scrollHeight - 200;

      // Load more when scrolled past threshold and near the end
      if (scrolledRows >= LOAD_THRESHOLD && isNearEnd && windowEnd < filteredData.length) {
        isLoadingMore.current = true;
        setWindowEnd(prev => {
          const newEnd = Math.min(prev + WINDOW_SIZE, filteredData.length);
          setTimeout(() => {
            isLoadingMore.current = false;
          }, 100);
          return newEnd;
        });
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [filteredData.length, windowEnd, groupByColumns]);

  const hasChanges = useMemo(() => {
    return editedData.length > 0 && (
      editedData.length !== data.length ||
      editedData.some(row => row._status === 'draft' || row._status === 'edited')
    );
  }, [editedData, data]);

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
      const withoutDrafts = editedData.filter(row => row._status !== 'draft');
      const newData = withoutDrafts.map(row => {
        if (row._status === 'edited') {
          const original = data.find(d => d.id === row.id);
          return original ? { ...original } : row;
        }
        return row;
      });
      setEditedData(newData);
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

    if (!externalIsSaving) {
      setIsSaving(true);
    }
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
      if (!externalIsSaving) {
        setIsSaving(false);
      }
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
      setEditedData([...editedData, newRow]);
    }
    setEditingRows(prev => [...prev, newRow.id]);
  };

  const handleCellEdit = (id: string, key: string, value: string | boolean) => {
    setEditedData(
      editedData.map(row =>
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
      return <ArrowUpDown className="dt-sort-icon dt-sort-icon-inactive" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="dt-sort-icon" />
      : <ArrowDown className="dt-sort-icon" />;
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

  const countRows = (data: any): number => {
    if (Array.isArray(data)) return data.length;
    return Object.values(data).reduce<number>((sum, val) => {
      return sum + countRows(val);
    }, 0);
  };

  const renderNestedGroups = (data: any, groupColumns: string[], level: number = 0, parentKey: string = ''): React.ReactNode => {
    if (Array.isArray(data)) {
      return data.map((row) => (
        <TableRow key={row.id} className={getRowClassName(row)}>
          <TableCell className="dt-cell-checkbox">
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
                      <SelectTrigger className="dt-select-trigger">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dt-select-content">
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
                      className="dt-input"
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
            className="dt-group-row"
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
              <div className="dt-group-content" style={{ paddingLeft: `${level * 1.5}rem` }}>
                {isExpanded ? (
                  <ChevronDown className="dt-icon-sm" />
                ) : (
                  <ChevronRight className="dt-icon-sm" />
                )}
                <Group className="dt-icon-sm" />
                <span className="dt-group-label">
                  {columns.find(c => c.key === groupColumns[level])?.title}:
                </span>
                {groupValue} <span className="dt-group-count">({rowCount})</span>
              </div>
            </TableCell>
          </TableRow>
          {isExpanded && renderNestedGroups(groupData, groupColumns, level + 1, groupKey)}
        </React.Fragment>
      );
    });
  };

  return (
    <>
      <style>{`
        .dt-container {
          display: flex;
          flex-direction: column;
          flex: 1;
          gap: 1rem;
        }

        .dt-container-fullscreen {
          position: fixed;
          inset: 0;
          z-index: 50;
          background-color: hsl(var(--background));
          padding: 1.5rem;
        }

        .dt-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin: 5px;
        }

        .dt-toolbar-left, .dt-toolbar-right {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }

        .dt-icon-sm {
          height: 1rem;
          width: 1rem;
        }

        .dt-icon-md {
          height: 1rem;
          width: 1rem;
          margin-right: 0.5rem;
        }

        .dt-sort-icon {
          height: 1rem;
          width: 1rem;
          margin-left: 0.5rem;
        }

        .dt-sort-icon-inactive {
          opacity: 0.5;
        }

        .dt-button-scale {
          transition: all 200ms;
        }

        .dt-button-scale:hover {
          transform: scale(1.05);
        }

        .dt-spinner {
          animation: spin 1s linear infinite;
          border-radius: 9999px;
          height: 1rem;
          width: 1rem;
          border-bottom-width: 2px;
          border-color: white;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .dt-search-wrapper {
          position: relative;
        }

        .dt-search-icon {
          position: absolute;
          left: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          height: 1rem;
          width: 1rem;
          color: hsl(var(--muted-foreground));
        }

        .dt-search-input {
          padding-left: 2rem;
          width: 16rem;
        }

        .dt-badge-count {
          margin-left: 0.5rem;
          height: 1.25rem;
          padding-left: 0.375rem;
          padding-right: 0.375rem;
        }

        .dt-dropdown-content {
          width: 14rem;
          background-color: hsl(var(--popover));
          z-index: 50;
        }

        .dt-dropdown-inner {
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .dt-dropdown-header {
          font-size: 0.75rem;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
          margin-bottom: 0.5rem;
        }

        .dt-dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem;
          border-radius: 0.375rem;
          cursor: pointer;
        }

        .dt-dropdown-item:hover {
          background-color: hsl(var(--accent));
        }

        .dt-dropdown-item-text {
          font-size: 0.875rem;
        }

        .dt-badge-order {
          height: 1.25rem;
          width: 1.25rem;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dt-separator {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .dt-clear-button {
          width: 100%;
        }

        .dt-table-wrapper {
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .dt-loading-overlay {
          position: absolute;
          inset: 0;
          background-color: hsl(var(--background) / 0.8);
          backdrop-filter: blur(4px);
          z-index: 30;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dt-loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .dt-loading-spinner {
          height: 2rem;
          width: 2rem;
          animation: spin 1s linear infinite;
          color: hsl(var(--primary));
        }

        .dt-loading-text {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .dt-table-scroll {
          overflow-y: auto;
          max-height: calc(100vh - 280px);
        }

        .dt-table-header {
          background-color: hsl(var(--table-header));
          position: sticky;
          top: 0;
          z-index: 20;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }

        .dt-cell-checkbox {
          width: 3rem;
        }

        .dt-header-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .dt-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dt-sort-button {
          height: auto;
          padding: 0.25rem;
          min-width: auto;
        }

        .dt-sort-button:hover {
          background-color: hsl(var(--accent));
        }

        .dt-filter-button {
          height: 1.75rem;
          padding-left: 0.5rem;
          padding-right: 0.5rem;
          font-size: 0.75rem;
        }

        .dt-filter-button-active {
          background-color: hsl(var(--primary) / 0.1);
          color: hsl(var(--primary));
        }

        .dt-filter-icon {
          height: 0.75rem;
          width: 0.75rem;
          margin-right: 0.25rem;
        }

        .dt-popover-content {
          width: 16rem;
          background-color: hsl(var(--popover));
          z-index: 50;
        }

        .dt-popover-inner {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .dt-clear-filter-button {
          width: 100%;
        }

        .dt-select-trigger {
          height: 2rem;
        }

        .dt-select-content {
          background-color: hsl(var(--popover));
          z-index: 50;
        }

        .dt-input {
          height: 2rem;
        }

        .dt-group-row {
          background-color: hsl(var(--muted) / 0.3);
          font-weight: 600;
          cursor: pointer;
        }

        .dt-group-row:hover {
          background-color: hsl(var(--muted) / 0.5);
        }

        .dt-group-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dt-group-label {
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
          margin-right: 0.5rem;
        }

        .dt-group-count {
          color: hsl(var(--muted-foreground));
        }

        .dt-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-left: 1rem;
          padding-right: 1rem;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-top: 1px solid hsl(var(--border));
          background-color: hsl(var(--muted) / 0.3);
        }

        .dt-footer-text {
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
        }

        .dt-footer-highlight {
          font-weight: 500;
          color: hsl(var(--foreground));
        }

        .dt-footer-filtered {
          margin-left: 0.5rem;
        }
      `}</style>

      <div className={cn(
        "dt-container",
        isFullscreen && "dt-container-fullscreen",
        className
      )}>
        <div className="dt-toolbar">
          <div className="dt-toolbar-left">
            <Button
              variant={editingRows.length > 0 ? "default" : "outline"}
              size="sm"
              onClick={handleEditMode}
            >
              <Edit className="dt-icon-md" />
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
                disabled={isCurrentlySaving}
                className="animate-fade-in"
              >
                {isCurrentlySaving ? (
                  <>
                    <div className="dt-spinner"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="dt-icon-md" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddRow}
              className="dt-button-scale"
            >
              <Plus className="dt-icon-md" />
              Add {entityType}
            </Button>
            
            {selectedRows.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDelete}
                disabled={isCurrentlyDeleting}
              >
                {isCurrentlyDeleting ? (
                  <>
                    <div className="dt-spinner"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="dt-icon-md" />
                    Delete ({selectedRows.length})
                  </>
                )}
              </Button>
            )}
          </div>
          
          <div className="dt-toolbar-right">
            <div className="dt-search-wrapper">
              <Search className="dt-search-icon" />
              <Input
                placeholder="Search all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dt-search-input"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Group className="dt-icon-md" />
                  Group By
                  {groupByColumns.length > 0 && (
                    <Badge variant="secondary" className="dt-badge-count">
                      {groupByColumns.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dt-dropdown-content">
                <div className="dt-dropdown-inner">
                  <div className="dt-dropdown-header">Select columns to group by (in order)</div>
                  {columns.map((col) => {
                    const isSelected = groupByColumns.includes(col.key);
                    const order = groupByColumns.indexOf(col.key);
                    return (
                      <div
                        key={col.key}
                        className="dt-dropdown-item"
                        onClick={() => {
                          if (isSelected) {
                            setGroupByColumns(prev => prev.filter(k => k !== col.key));
                          } else {
                            setGroupByColumns(prev => [...prev, col.key]);
                          }
                        }}
                      >
                        <span className="dt-dropdown-item-text">{col.title}</span>
                        {isSelected && (
                          <Badge variant="default" className="dt-badge-order">
                            {order + 1}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                  {groupByColumns.length > 0 && (
                    <>
                      <Separator className="dt-separator" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="dt-clear-button"
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
              <Filter className="dt-icon-md" />
              Filters
            </Button>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                title="Clear all filters"
              >
                <FilterX className="dt-icon-sm" />
              </Button>
            )}
            
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isCurrentlySaving || isCurrentlyDeleting}
                title="Refresh data"
              >
                <RefreshCw className="dt-icon-sm" />
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              title="Download as CSV"
            >
              <Download className="dt-icon-sm" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize className="dt-icon-sm" />
            </Button>
          </div>
        </div>

        <div className="dt-table-wrapper">
          {(isCurrentlySaving || isCurrentlyDeleting) && (
            <div className="dt-loading-overlay">
              <div className="dt-loading-content">
                <Loader2 className="dt-loading-spinner" />
                <p className="dt-loading-text">
                  {isCurrentlySaving ? 'Saving changes...' : 'Deleting rows...'}
                </p>
              </div>
            </div>
          )}
          <div className="dt-table-scroll" ref={scrollContainerRef}>
          <Table>
            <TableHeader className="dt-table-header">
              <TableRow>
                <TableHead className="dt-cell-checkbox">
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
                    <div className="dt-header-content">
                      <div className="dt-header-row">
                        <span
                          className={cn(
                            "font-semibold cursor-pointer hover:text-primary transition-colors",
                            col.onHeaderClick && "cursor-pointer"
                          )}
                          onClick={() => col.onHeaderClick?.(col.key)}
                        >
                          {col.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="dt-sort-button ml-1"
                          onClick={() => handleSort(col.key)}
                          title="Sort column"
                        >
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
                                "dt-filter-button",
                                columnFilters[col.key] && "dt-filter-button-active"
                              )}
                            >
                              <Filter className="dt-filter-icon" />
                              {columnFilters[col.key] ? 'Filtered' : 'Filter'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="dt-popover-content" align="start">
                            <div className="dt-popover-inner">
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
                                  className="dt-clear-filter-button"
                                  onClick={() => {
                                    setColumnFilters(prev => {
                                      const newFilters = { ...prev };
                                      delete newFilters[col.key];
                                      return newFilters;
                                    });
                                  }}
                                >
                                  <X className="dt-icon-md" />
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
                visibleData.map((row) => (
                  <TableRow key={row.id} className={getRowClassName(row)}>
                    <TableCell className="dt-cell-checkbox">
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
                                <SelectTrigger className="dt-select-trigger">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="dt-select-content">
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
                                className="dt-input"
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
        
        <div className="dt-footer">
          <div className="dt-footer-text">
            Total rows: <span className="dt-footer-highlight">{filteredData.length}</span>
            {filteredData.length !== data.length && (
              <span className="dt-footer-filtered">
                (filtered from {data.length})
              </span>
            )}
            {groupByColumns.length === 0 && windowEnd < filteredData.length && (
              <span className="dt-footer-filtered">
                (showing first {windowEnd} rows)
              </span>
            )}
          </div>
          {groupByColumns.length > 0 && (
            <div className="dt-footer-text">
              Grouped by: <span className="dt-footer-highlight">{groupByColumns.map(col => columns.find(c => c.key === col)?.title).join(' → ')}</span>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};