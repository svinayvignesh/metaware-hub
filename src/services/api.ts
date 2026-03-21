/**
 * API Service for MetaWare Backend Integration
 * 
 * This service provides functions to interact with the MetaWare REST API
 * for managing namespaces, subject areas, entities, and metadata fields.
 */

import { API_CONFIG } from '../config/api';

const API_BASE_URL = API_CONFIG.REST_ENDPOINT;

/**
 * Generic API request helper
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

/**
 * Namespace API Operations
 */
export const namespaceAPI = {
  create: async (namespaces: any[]) => {
    return apiRequest('/mwn/create_namespaces', {
      method: 'POST',
      body: JSON.stringify(namespaces),
    });
  },

  delete: async (ids: string[]) => {
    return apiRequest('/mwn/delete', {
      method: 'POST',
      body: JSON.stringify({
        object_type: 'namespace',
        ids,
      }),
    });
  },
};

/**
 * Subject Area API Operations
 */
export const subjectAreaAPI = {
  create: async (subjectAreas: any[]) => {
    return apiRequest('/mwn/create_subjectareas', {
      method: 'POST',
      body: JSON.stringify(subjectAreas),
    });
  },

  delete: async (ids: string[]) => {
    return apiRequest('/mwn/delete', {
      method: 'POST',
      body: JSON.stringify({
        object_type: 'subjectarea',
        ids,
      }),
    });
  },
};

/**
 * Entity API Operations
 */
export const entityAPI = {
  create: async (entities: any[]) => {
    return apiRequest('/mwn/create_entities', {
      method: 'POST',
      body: JSON.stringify(entities),
    });
  },

  createWithMeta: async (entityData: any, metaFields: any[]) => {
    return apiRequest('/mwn/create_entity', {
      method: 'POST',
      body: JSON.stringify({
        entity_request: entityData,
        meta_requests: metaFields,
      }),
    });
  },

  delete: async (ids: string[]) => {
    return apiRequest('/mwn/delete', {
      method: 'POST',
      body: JSON.stringify({
        object_type: 'entity',
        ids,
      }),
    });
  },
};

/**
 * Meta Field API Operations
 */
export const metaAPI = {
  delete: async (ids: string[]) => {
    return apiRequest('/mwn/delete', {
      method: 'POST',
      body: JSON.stringify({
        object_type: 'meta',
        ids,
      }),
    });
  },

  autoDetectStaging: async (
    file: File,
    params: {
      ns: string;
      sa: string;
      en: string;
      ns_type: string;
      create_meta: boolean;
      load_data: boolean;
      primary_grain: string;
    }
  ) => {
    const formData = new FormData();
    formData.append('file', file);

    const queryParams = new URLSearchParams({
      ns: params.ns,
      sa: params.sa,
      en: params.en,
      ns_type: params.ns_type,
      create_meta: String(params.create_meta),
      load_data: String(params.load_data),
      primary_grain: params.primary_grain,
    });

    const response = await fetch(`${API_BASE_URL}/mwn/auto_detect_staging?${queryParams}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  },

  /** Auto-detect schema from external database table (no file upload) */
  autoDetectStagingDb: async (params: {
    ns: string;
    sa: string;
    en: string;
    ns_type: string;
    source_kind: string;
    connection_name: string;
    source_database: string;
    source_schema: string;
    source_table: string;
    create_meta: boolean;
    primary_grain: string;
    subtype: string;
  }) => {
    const queryParams = new URLSearchParams({
      ns: params.ns,
      sa: params.sa,
      en: params.en,
      ns_type: params.ns_type,
      source_kind: params.source_kind,
      connection_name: params.connection_name,
      source_database: params.source_database,
      source_schema: params.source_schema,
      source_table: params.source_table,
      create_meta: String(params.create_meta),
      primary_grain: params.primary_grain,
      subtype: params.subtype,
    });

    return apiRequest<any>(`/mwn/auto_detect_staging_db?${queryParams}`, {
      method: 'POST',
    });
  },

  importConfiguration: async (file: File, sheetName: string) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/mwn/import_configuration?sheet_name=${encodeURIComponent(sheetName)}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  },
};

/**
 * Connection Profile type
 */
export interface ConnectionProfile {
  name: string;
  type: string;          // "db.postgres", "db.duckdb", etc.
  connection_properties: Record<string, any>;
  description?: string;
  status: string;        // "active", "inactive"
}

/**
 * Connection Profile API Operations
 */
export const connectionProfileAPI = {
  /** List all connection profiles, optionally filtered by type */
  list: async (type?: string) => {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    return apiRequest<{
      status_code: number;
      return_data: ConnectionProfile[];
    }>(`/mwn/connection_profiles${query}`);
  },

  /** Create a new connection profile */
  create: async (profile: {
    name: string;
    type: string;
    connection_properties: Record<string, any>;
    description?: string;
  }) => {
    return apiRequest('/mwn/connection_profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  },

  /** Delete a connection profile */
  delete: async (name: string) => {
    return apiRequest(`/mwn/connection_profiles/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  },

  /** Test connectivity of a connection profile */
  test: async (name: string) => {
    return apiRequest<{
      status_code: number;
      return_data: { status: 'connected' | 'failed'; message: string };
    }>(`/mwn/connection_profiles/${encodeURIComponent(name)}/test`, {
      method: 'POST',
    });
  },

  /** List schemas available in the external database */
  listSchemas: async (name: string) => {
    return apiRequest<{
      status_code: number;
      return_data: string[];
    }>(`/mwn/connection_profiles/${encodeURIComponent(name)}/schemas`, {
      method: 'POST',
    });
  },

  /** List tables in a specific schema of the external database */
  listTables: async (name: string, schema: string) => {
    return apiRequest<{
      status_code: number;
      return_data: string[];
    }>(`/mwn/connection_profiles/${encodeURIComponent(name)}/tables?schema=${encodeURIComponent(schema)}`, {
      method: 'POST',
    });
  },
};

/**
 * Glossary API Operations
 */
export const glossaryAPI = {
  generateSuggestions: async (entityIds: string[], targetNs: string, targetSa: string) => {
    return apiRequest('/mwn/generate_glossary_suggestions', {
      method: 'POST',
      body: JSON.stringify({ 
        entity_ids: entityIds,
        target_ns: targetNs,
        target_sa: targetSa,
      }),
    });
  },

  generateCustomBlueprint: async (params: {
    topic: string;
    num_fields: number;
    example_data: string;
    target_ns: string;
    target_sa: string;
    target_en: string;
  }) => {
    return apiRequest('/mwn/generate_custom_blueprint', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};

/**
 * Ruleset API Operations
 */
/**
 * Orchestration API Operations
 */
export const orchestrationAPI = {
  configure: async (payload: {
    entity_id: string;
    entity_fqn: string;
    asset_name: string;
    asset_group: string;
    asset_type: string;
    task_key: string;
    execution_config: {
      connection_name: string;
      file_format: string;
      delimiter: string;
      encoding: string;
      header: boolean;
      infer_schema: boolean;
      load_strategy: string;
      batch_size: number;
    };
    triggers: Array<{
      trigger_type: 'file_sensor' | 'schedule';
      file_sensor?: { watch_path: string; file_pattern: string };
      schedule?: { cron_schedule: string; timezone: string };
    }>;
    discover_dependencies: boolean;
    regenerate_code: boolean;
  }) => {
    return apiRequest<any>('/mwn/configure_orchestration', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete orchestration objects (data_asset, asset_task, task_dependency)
   */
  deleteOrchestration: async (payload: {
    object_type: 'data_asset' | 'asset_task' | 'task_dependency';
    ids: string[];
    cascade?: boolean;
  }) => {
    return apiRequest<{
      status_code: number;
      status: string;
      return_data: Array<{ id: string; status: string; error?: string }>;
    }>('/mwn/delete_orchestration', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

/**
 * Ruleset API Operations
 */
export const rulesetAPI = {
  create: async (payload: any) => {
    return apiRequest('/mwn/create_ruleset', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

/**
 * Entity Relation API Operations
 */
export const entityRelationAPI = {
  create: async (payload: { target_en_id: string; related_en_id: string; relation_type: string; metadata_?: any }) => {
    return apiRequest('/mwn/entity_relation', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  delete: async (relationId: string) => {
    return apiRequest(`/mwn/entity_relation/${relationId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Glossary Association API Operations
 */
export const glossaryAssociationAPI = {
  delete: async (glossaryEnCore: { ns: string; sa: string; en: string }, sourceEnCore: { ns: string; sa: string; en: string }) => {
    return apiRequest('/mwn/delete_glossary_association', {
      method: 'POST',
      body: JSON.stringify({
        glossary_en_core: glossaryEnCore,
        source_en_core: sourceEnCore,
      }),
    });
  },
};

/**
 * Glossary Relation API Operations (LINK, EXACT, RELATED, SUBSET between glossary entities)
 */
export const glossaryRelationAPI = {
  delete: async (relationId: string) => {
    return apiRequest(`/mwn/glossary_relation/${relationId}`, {
      method: 'DELETE',
    });
  },
};