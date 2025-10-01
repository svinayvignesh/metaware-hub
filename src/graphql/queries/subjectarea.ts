/**
 * GraphQL Queries for Subject Area Management
 * 
 * This file contains all GraphQL queries related to subject area operations.
 * Subject areas represent logical groupings of related entities within
 * a namespace in the MetaWare metadata management system.
 * 
 * Query Structure:
 * - GET_SUBJECTAREAS: Retrieves all subject areas with their associated namespace info
 * 
 * @author MetaWare Development Team
 * @version 1.0.0
 */

import { gql } from '@apollo/client';

/**
 * Query to fetch all subject areas from the backend
 * 
 * This query retrieves subject area information including:
 * - id: Unique identifier for the subject area
 * - name: Human-readable name of the subject area
 * - ns_id: Foreign key reference to the parent namespace
 * - tags: Associated tags for categorization
 * - type: Type classification of the subject area
 * - namespace: Nested namespace information (name and type)
 * 
 * Parameters:
 * - id: Filter by specific subject area ID (empty string returns all)
 * 
 * Usage:
 * ```typescript
 * const { data, loading, error } = useQuery(GET_SUBJECTAREAS);
 * ```
 */
export const GET_SUBJECTAREAS = gql`
  query GET_SUBJECTAREAS {
    meta_subjectarea(id: "") {
      id
      name
      ns_id
      tags
      type
      namespace {
        id
        name
        type
      }
    }
  }
`;

/**
 * TypeScript interfaces for type safety
 * These interfaces ensure proper typing for subject area data structures
 */

/**
 * Nested namespace information within subject area
 */
export interface SubjectAreaNamespace {
  /** Unique identifier for the namespace */
  id: string;
  /** Name of the parent namespace */
  name: string;
  /** Type of the parent namespace */
  type: string;
}

/**
 * Subject area data structure returned by GraphQL
 */
export interface SubjectArea {
  /** Unique identifier for the subject area */
  id: string;
  /** Human-readable name of the subject area */
  name: string;
  /** Foreign key reference to the parent namespace */
  ns_id: string;
  /** Associated tags for categorization */
  tags?: string[];
  /** Type classification of the subject area */
  type: string;
  /** Nested namespace information */
  namespace: SubjectAreaNamespace;
}

/**
 * GraphQL response structure for GET_SUBJECTAREAS query
 */
export interface GetSubjectAreasResponse {
  meta_subjectarea: SubjectArea[];
}

/**
 * Variables for GET_SUBJECTAREAS query
 */
export interface GetSubjectAreasVariables {
  id?: string;
}