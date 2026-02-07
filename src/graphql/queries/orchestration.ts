/**
 * GraphQL Queries for Orchestration Management
 *
 * This file contains all GraphQL queries related to orchestration operations.
 * Orchestration covers data assets, tasks, triggers (file sensors & schedules),
 * and task dependencies in the MetaWare system.
 *
 * @author MetaWare Development Team
 * @version 1.0.0
 */

import { gql } from '@apollo/client';

/**
 * Query to fetch staging orchestration data assets with their tasks
 */
export const GET_ORCHESTRATION = gql`
  query GET_ORCHESTRATION {
    orchestration_data_asset(assetType: "staging") {
      id
      name
      assetKey
      entityId
      entityFqn
      assetType
      assetGroup
      enabled
      description
      partitioned
      tasks {
        id
        assetId
        taskKey
        name
        taskType
        triggerType
        triggerConfig
        executionConfig
        enabled
        description
      }
      entity {
        id
        type
        name
        sa_id
        subjectarea {
          id
          name
          ns_id
          namespace {
            id
            name
          }
        }
      }
    }
  }
`;

// === Response Types ===

export interface OrchestrationTask {
  id: string;
  assetId: string;
  taskKey: string;
  name: string;
  taskType: string;
  triggerType: "file_sensor" | "schedule" | null;
  triggerConfig: {
    file_pattern?: string;
    watch_path?: string;
    inbox_path?: string;
    post_action?: string;
    archive_path?: string;
    cron?: string;
    cron_schedule?: string;
    timezone?: string;
  } | null;
  executionConfig: Record<string, any> | null;
  enabled: boolean;
  description: string | null;
}

export interface OrchestrationNamespace {
  id: string;
  name: string;
}

export interface OrchestrationSubjectArea {
  id: string;
  name: string;
  ns_id: string;
  namespace: OrchestrationNamespace | null;
}

export interface OrchestrationEntity {
  id: string;
  type: string;
  name: string;
  sa_id: string;
  subjectarea: OrchestrationSubjectArea | null;
}

export interface OrchestrationAsset {
  id: string;
  name: string;
  assetKey: string;
  entityId: string;
  entityFqn: string | null;
  assetType: string;
  assetGroup: string;
  enabled: boolean;
  description: string | null;
  partitioned: boolean;
  tasks: OrchestrationTask[];
  entity: OrchestrationEntity;
}

export interface GetOrchestrationResponse {
  orchestration_data_asset: OrchestrationAsset[];
}
