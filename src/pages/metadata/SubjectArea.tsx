/**
 * Subject Area Management Page
 * 
 * This component provides a comprehensive interface for managing subject areas
 * within the MetaWare metadata management system. Subject areas represent
 * logical groupings of related entities within a namespace.
 * 
 * Features:
 * - Display all subject areas with their namespace relationships
 * - CRUD operations (Create, Read, Update, Delete)
 * - Real-time data synchronization with GraphQL API
 * - Inline editing capabilities
 * - Nested namespace information display
 * 
 * @author MetaWare Development Team
 * @version 1.0.0
 */

import { useQuery } from '@apollo/client';
import { DataTable, Column, TableData } from "@/components/table/DataTable";
import { GET_SUBJECTAREAS, type GetSubjectAreasResponse } from "@/graphql/queries";
import { subjectAreaAPI } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

/**
 * Column configuration for the subject area table
 * Defines the structure and display properties for each column
 */
const subjectAreaColumns: Column[] = [
  { key: 'name', title: 'Subject Area Name', type: 'text' },
  { key: 'namespace_name', title: 'NameSpace', type: 'text' },
  { key: 'namespace_type', title: 'NameSpace Type', type: 'text' },
  { key: 'type', title: 'Type', type: 'text' },
  { key: 'tags', title: 'Tags', type: 'text' },
];

/**
 * Subject Area Management Component
 * 
 * Renders the subject area management interface with real-time data
 * from the GraphQL API and provides full CRUD functionality.
 */
export default function SubjectArea() {
  const { toast } = useToast();
  
  /**
   * GraphQL query to fetch all subject areas with nested namespace data
   * Handles loading states, errors, and data updates automatically
   */
  const { data, loading, error, refetch } = useQuery<GetSubjectAreasResponse>(GET_SUBJECTAREAS);

  /**
   * Transform GraphQL data to table format
   * Converts the subject area data structure to match DataTable requirements
   * and flattens nested namespace information
   */
  const tableData: TableData[] = data?.meta_subjectarea.map(subjectArea => ({
    id: subjectArea.id,
    name: subjectArea.name,
    namespace_name: subjectArea.namespace.name,
    namespace_type: subjectArea.namespace.type,
    type: subjectArea.type,
    tags: Array.isArray(subjectArea.tags) ? subjectArea.tags.join(', ') : subjectArea.tags || '',
    // Store original namespace ID for mutations
    ns_id: subjectArea.ns_id,
  })) || [];


  /**
   * Handle editing existing subject area
   */
  const handleEdit = async (id: string, updatedData: Partial<TableData>) => {
    try {
      const existingSubjectArea = tableData.find(item => item.id === id);
      if (!existingSubjectArea) return;

      const subjectAreaData = {
        ...existingSubjectArea,
        ...updatedData,
        update_strategy_: 'U',
      };

      await subjectAreaAPI.create([subjectAreaData]);
      await refetch();
      toast({
        title: "Success",
        description: "Subject area updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update subject area: ${error}`,
        variant: "destructive",
      });
    }
  };

  /**
   * Handle deleting subject areas
   */
  const handleDelete = async (ids: string[]) => {
    try {
      await subjectAreaAPI.delete(ids);
      await refetch();
      toast({
        title: "Success",
        description: `${ids.length} subject area(s) deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete subject areas: ${error}`,
        variant: "destructive",
      });
    }
  };

  /**
   * Handle bulk save operations
   */
  const handleSave = async (data: TableData[]) => {
    try {
      const subjectAreasToSave = data.map(item => ({
        id: item.id.startsWith('new_') ? item.name || `sa_${Date.now()}` : item.id,
        type: item.type || '',
        name: item.name || '',
        tags: item.tags || '',
        custom_props: '',
        ns_id: item.ns_id || '',
        update_strategy_: item._status === 'draft' ? 'I' : 'U',
        ns: item.namespace_name || '',
      }));

      await subjectAreaAPI.create(subjectAreasToSave);
      await refetch();
      toast({
        title: "Success",
        description: "Changes saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save changes: ${error}`,
        variant: "destructive",
      });
    }
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subject Area Management</h1>
          <p className="text-muted-foreground">
            Organize related entities within logical business domains
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading subject areas...</div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subject Area Management</h1>
          <p className="text-muted-foreground">
            Organize related entities within logical business domains
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-destructive">
            Error loading subject areas: {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subject Area Management</h1>
        <p className="text-muted-foreground">
          Organize related entities within logical business domains
        </p>
      </div>

      {/* Data Table with GraphQL Integration */}
      <DataTable
        columns={subjectAreaColumns}
        data={tableData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSave={handleSave}
        entityType="Subject Area"
      />
    </div>
  );
}