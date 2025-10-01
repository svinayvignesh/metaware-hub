/**
 * GraphQL Queries for Conceptual Model Management
 * 
 * This file contains all GraphQL queries related to conceptual models.
 */

import { gql } from '@apollo/client';

/**
 * Query to fetch conceptual models
 */
export const GET_CONCEPTUAL_MODEL = gql`
  query GET_CONCEPTUAL_MODEL(
    $glossaryEntityFqn: String
    $glossaryEntityId: String
    $id: String
    $name: String
    $projectCode: String
  ) {
    conceptual_model(
      glossaryEntityFqn: $glossaryEntityFqn
      glossaryEntityId: $glossaryEntityId
      id: $id
      name: $name
      projectCode: $projectCode
    ) {
      id
      name
      projectCode
      conceptualModelFqn
      glossaryEntityFqn
      glossaryEntityId
      selected_metas {
        name
      }
      associated_source_entities {
        id
        name
        description
        is_delta
        primary_grain
        secondary_grain
        tertiary_grain
        runtime
        sa_id
        subtype
        type
        subjectarea {
          name
          namespace {
            name
          }
        }
      }
    }
  }
`;

/**
 * Query to fetch meta fields for a glossary entity
 */
export const GET_META_CONCEPTUAL = gql`
  query GET_META_CONCEPTUAL($entity: String!) {
    meta_meta(enid: $entity, includedInDatapipeByType: "glossary_association") {
      id
      name
      type
      subtype
      nullable
      description
      alias
      default
      order
      is_primary_grain
      is_secondary_grain
      is_tertiary_grain
    }
  }
`;

/**
 * TypeScript interfaces for type safety
 */

export interface ConceptualModelMeta {
  name: string;
}

export interface AssociatedSourceEntity {
  id: string;
  name: string;
  description?: string;
  is_delta: boolean;
  primary_grain?: string;
  secondary_grain?: string;
  tertiary_grain?: string;
  runtime?: string;
  sa_id: string;
  subtype?: string;
  type: string;
  subjectarea: {
    name: string;
    namespace: {
      name: string;
    };
  };
}

export interface ConceptualModel {
  id: string;
  name: string;
  projectCode: string;
  conceptualModelFqn: string;
  glossaryEntityFqn: string;
  glossaryEntityId: string;
  selected_metas: ConceptualModelMeta[];
  associated_source_entities: AssociatedSourceEntity[];
}

export interface GetConceptualModelResponse {
  conceptual_model: ConceptualModel[];
}

export interface GetConceptualModelVariables {
  glossaryEntityFqn?: string;
  glossaryEntityId?: string;
  id?: string;
  name?: string;
  projectCode?: string;
}

export interface MetaConceptualField {
  id: string;
  name: string;
  type: string;
  subtype: string;
  nullable: boolean;
  description?: string;
  alias: string;
  default?: string;
  order: number;
  is_primary_grain?: boolean;
  is_secondary_grain?: boolean;
  is_tertiary_grain?: boolean;
}

export interface GetMetaConceptualResponse {
  meta_meta: MetaConceptualField[];
}

export interface GetMetaConceptualVariables {
  entity: string;
}
