/**
 * GraphQL Queries for Namespace Management
 * 
 * This file contains all GraphQL queries related to namespace operations.
 * Namespaces represent logical boundaries for organizing data entities
 * within the MetaWare metadata management system.
 * 
 * Query Structure:
 * - GET_NAMESPACES: Retrieves all available namespaces with their metadata
 * 
 * @author MetaWare Development Team
 * @version 1.0.0
 */

import { gql } from '@apollo/client';

/**
 * Query to fetch all namespaces from the backend
 * 
 * This query retrieves namespace information including:
 * - id: Unique identifier for the namespace
 * - name: Human-readable name of the namespace
 * - status: Current status (Active, Draft, etc.)
 * - tags: Associated tags for categorization
 * - type: Type classification of the namespace
 * 
 * Parameters:
 * - status: Filter by status (empty string returns all)
 * - type: Filter by type (empty string returns all)
 * 
 * Usage:
 * ```typescript
 * const { data, loading, error } = useQuery(GET_NAMESPACES);
 * ```
 */
export const GET_NAMESPACES = gql`
  query GET_NAMESPACES($status: String, $type: String) {
    namespaces: meta_namespace(status: $status, type: $type) {
      id
      name
      status
      tags
      type
    }
  }
`;

/**
 * TypeScript interfaces for type safety
 * These interfaces ensure proper typing for namespace data structures
 */

/**
 * Namespace data structure returned by GraphQL
 */
export interface Namespace {
  /** Unique identifier for the namespace */
  id: string;
  /** Human-readable name of the namespace */
  name: string;
  /** Current status of the namespace */
  status: string;
  /** Associated tags for categorization */
  tags?: string[];
  /** Type classification of the namespace */
  type: string;
}

/**
 * GraphQL response structure for GET_NAMESPACES query
 */
export interface GetNamespacesResponse {
  meta_namespace: Namespace[];
}

/**
 * Variables for GET_NAMESPACES query
 */
export interface GetNamespacesVariables {
  status?: string;
  type?: string;
}