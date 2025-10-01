import { gql } from "@apollo/client";

export const GET_ENTITY_RELATIONS = gql`
  query GetEntityRelations($relatedEnId: String) {
    entity_relation(related_en_id: $relatedEnId) {
      id
      related_en_id
      relation_type
      target_en_id
      related_entity {
        description
        id
        is_delta
        name
        primary_grain
        runtime
        sa_id
        secondary_grain
        subtype
        tertiary_grain
        type
        conceptual_models {
          associated_source_entities {
            description
            id
            is_delta
            metas {
              alias
              default
              description
              id
              is_primary_grain
              is_secondary_grain
              is_tertiary_grain
              length
              name
              nullable
              order
              subtype
              type
            }
            name
            primary_grain
            runtime
            sa_id
            secondary_grain
            subtype
            tertiary_grain
            type
          }
          conceptualModelFqn
          glossaryEntityFqn
          glossaryEntityId
          id
          name
          projectCode
        }
      }
    }
  }
`;

export interface EntityMeta {
  alias: string | null;
  default: string | null;
  description: string | null;
  id: string;
  is_primary_grain: boolean;
  is_secondary_grain: boolean;
  is_tertiary_grain: boolean;
  length: number | null;
  name: string;
  nullable: boolean;
  order: number;
  subtype: string | null;
  type: string;
}

export interface AssociatedSourceEntity {
  description: string | null;
  id: string;
  is_delta: boolean;
  metas: EntityMeta[];
  name: string;
  primary_grain: string | null;
  runtime: string | null;
  sa_id: string;
  secondary_grain: string | null;
  subtype: string | null;
  tertiary_grain: string | null;
  type: string;
}

export interface ConceptualModel {
  associated_source_entities: AssociatedSourceEntity[];
  conceptualModelFqn: string;
  glossaryEntityFqn: string;
  glossaryEntityId: string;
  id: string;
  name: string;
  projectCode: string;
}

export interface RelatedEntity {
  description: string | null;
  id: string;
  is_delta: boolean;
  name: string;
  primary_grain: string | null;
  runtime: string | null;
  sa_id: string;
  secondary_grain: string | null;
  subtype: string | null;
  tertiary_grain: string | null;
  type: string;
  conceptual_models: ConceptualModel[];
}

export interface EntityRelation {
  id: string;
  related_en_id: string;
  relation_type: string;
  target_en_id: string;
  related_entity: RelatedEntity;
  target_entity: RelatedEntity;
}

export interface GetEntityRelationsResponse {
  entity_relation: EntityRelation[];
}

export interface GetEntityRelationsVariables {
  relatedEnId?: string;
}
