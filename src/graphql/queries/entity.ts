/**
 * GraphQL Queries for Entity Management
 * 
 * This file contains all GraphQL queries related to entity operations.
 * Entities represent individual data structures within subject areas
 * in the MetaWare metadata management system.
 * 
 * Query Structure:
 * - GET_ENTITIES: Retrieves all entities with their metadata and relationships
 * 
 * @author MetaWare Development Team
 * @version 1.0.0
 */

import { gql } from '@apollo/client';

/**
 * Query to fetch all entities from the backend
 * 
 * This query retrieves entity information including:
 * - id: Unique identifier for the entity
 * - description: Detailed description of the entity
 * - is_delta: Boolean indicating if entity supports delta processing
 * - name: Human-readable name of the entity
 * - primary_grain: Primary level of granularity
 * - secondary_grain: Secondary level of granularity
 * - tertiary_grain: Tertiary level of granularity
 * - subtype: Subtype classification
 * - type: Type classification of the entity
 * - sa_id: Foreign key reference to the parent subject area
 * - subjectarea: Nested subject area and namespace information
 * 
 * Parameters:
 * - grain: Filter by grain level (empty string returns all)
 * - id: Filter by specific entity ID (empty string returns all)
 * - name: Filter by entity name (empty string returns all)
 * - type: Filter by entity type (empty string returns all)
 * 
 * Usage:
 * ```typescript
 * const { data, loading, error } = useQuery(GET_ENTITIES);
 * ```
 */
export const GET_ENTITIES = gql`
  query GET_ENTITIES {
    meta_entity(grain: "", id: "", name: "", type: "") {
      id
      description
      is_delta
      name
      primary_grain
      secondary_grain
      tertiary_grain
      subtype
      type
      sa_id
      subjectarea {
        name
        namespace {
          id
          name
          type
        }
      }
    }
  }
`;

/**
 * TypeScript interfaces for type safety
 * These interfaces ensure proper typing for entity data structures
 */

/**
 * Nested namespace information within entity's subject area
 */
export interface EntityNamespace {
  /** Unique identifier for the namespace */
  id: string;
  /** Name of the namespace */
  name: string;
  /** Type of the namespace */
  type: string;
}

/**
 * Nested subject area information within entity
 */
export interface EntitySubjectArea {
  /** Name of the subject area */
  name: string;
  /** Nested namespace information */
  namespace: EntityNamespace;
}

/**
 * Entity data structure returned by GraphQL
 */
export interface Entity {
  /** Unique identifier for the entity */
  id: string;
  /** Detailed description of the entity */
  description?: string;
  /** Boolean indicating if entity supports delta processing */
  is_delta: boolean;
  /** Human-readable name of the entity */
  name: string;
  /** Primary level of granularity */
  primary_grain?: string;
  /** Secondary level of granularity */
  secondary_grain?: string;
  /** Tertiary level of granularity */
  tertiary_grain?: string;
  /** Subtype classification */
  subtype?: string;
  /** Type classification of the entity */
  type: string;
  /** Foreign key reference to the parent subject area */
  sa_id: string;
  /** Nested subject area and namespace information */
  subjectarea: EntitySubjectArea;
}

/**
 * GraphQL response structure for GET_ENTITIES query
 */
export interface GetEntitiesResponse {
  meta_entity: Entity[];
}

/**
 * Variables for GET_ENTITIES query
 */
export interface GetEntitiesVariables {
  grain?: string;
  id?: string;
  name?: string;
  type?: string;
}