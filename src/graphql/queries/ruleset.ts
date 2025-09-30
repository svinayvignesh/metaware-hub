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
 * TypeScript interfaces for type safety
 */

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
  meta?: string;
}

export interface Ruleset {
  id: string;
  type: string;
  name: string;
  description?: string;
  view_name?: string;
  target_en_id: string;
  source_id?: string;
  transform_id?: string;
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
