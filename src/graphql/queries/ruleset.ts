/**
 * GraphQL Queries for Ruleset Management
 * 
 * This file contains all GraphQL queries related to data quality rulesets.
 */

import { gql } from '@apollo/client';

/**
 * Query to fetch rulesets for an entity
 */
export const GET_META_RULESETS = gql`
  query GET_META_RULESETS($id: String!, $sourceId: String!, $targetEnId: String!, $type: String!) {
    meta_ruleset(id: $id, sourceId: $sourceId, targetEnId: $targetEnId, type: $type) {
      name
      rules {
        rule_expression
        alias
        name
        description
        id
        is_shared
        language
        meta_id
        rule_status
        subtype
        type
        meta {
          name
          alias
          id
        }
      }
      id
      source_id
      target_en_id
      type
      view_name
    }
  }
`;

/**
 * Query to fetch mapping rules for a specific ruleset
 */
export const GET_MAPPING_RULES = gql`
  query MAPPING_RULES($id: String!) {
    meta_ruleset(id: $id) {
      id
      type
      name
      target_en_id
      view_name
      rules {
        id
        type
        subtype
        name
        alias
        rule_expression
        rule_status
        description
        is_shared
        language
        meta_id
        meta {
          id
          name
        }
      }
      source {
        id
        type
        source_filter
        source_en_id
        source_entity {
          id
          name
          subjectarea {
            id
            name
            namespace {
              id
              name
            }
          }
        }
      }
    }
  }
`;

/**
 * Query to fetch rulesets by target entity ID and type
 */
export const GET_RULESETS_BY_ENTITY = gql`
  query GET_RULESETS_BY_ENTITY($targetEnId: String!, $type: String!) {
    meta_ruleset(targetEnId: $targetEnId, type: $type) {
      id
      type
      subtype
      name
      target_en_id
      view_name
      rules {
        id
        type
        subtype
        name
        alias
        rule_expression
        rule_status
        description
        is_shared
        language
        meta_id
        meta {
          id
          name
        }
      }
      source {
        id
        type
        source_filter
        source_en_id
        source_entity {
          id
          name
          subjectarea {
            id
            name
            namespace {
              id
              name
            }
          }
        }
      }
      child_rulesets {
        id
        type
        subtype
        name
        view_name
        transform {
          id
          type
          strategy
          name
          transform_config
        }
        rules {
          id
          type
          subtype
          name
          alias
          rule_expression
          rule_status
          language
          meta_id
          meta {
            id
            name
          }
        }
      }
    }
  }
`;

/**
 * TypeScript interfaces for type safety
 */

export interface TransformInfo {
  id: string;
  type: string;
  strategy?: string;
  name?: string;
  transform_config?: Record<string, any>;
}

export interface Rule {
  id?: string;
  type: string;
  subtype: string;
  name: string;
  alias?: string;
  description?: string;
  rule_status: string;
  is_shared?: boolean | null;
  rule_expression: string;
  rule_priority?: number;
  rule_category?: string;
  rule_tags?: string;
  rule_params?: string;
  color?: string | null;
  language: string;
  fn_name?: string;
  fn_package?: string;
  fn_imports?: string;
  meta_id?: string;
  meta?: {
    name: string;
    alias?: string;
    id: string;
  };
}

export interface Ruleset {
  id: string;
  type: string;
  subtype?: string;
  name: string;
  description?: string;
  view_name?: string;
  target_en_id: string;
  source_id?: string;
  transform_id?: string;
  transform?: TransformInfo;
  rules: Rule[];
}

export interface GetMetaRulesetsResponse {
  meta_ruleset: Ruleset[];
}

export interface GetMetaRulesetsVariables {
  id: string;
  sourceId: string;
  targetEnId: string;
  type: string;
}

export interface Source {
  id: string;
  type: string;
  source_filter?: string;
  source_en_id: string;
  source_entity: {
    id: string;
    name: string;
    subjectarea: {
      id: string;
      name: string;
      namespace: {
        id: string;
        name: string;
      };
    };
  };
}

export interface RulesetWithSource extends Ruleset {
  source?: Source;
  child_rulesets?: Ruleset[];
}

export interface GetMappingRulesResponse {
  meta_ruleset: RulesetWithSource[];
}

export interface GetMappingRulesVariables {
  id: string;
}

export interface GetRulesetsByEntityResponse {
  meta_ruleset: RulesetWithSource[];
}

export interface GetRulesetsByEntityVariables {
  targetEnId: string;
  type: string;
}
