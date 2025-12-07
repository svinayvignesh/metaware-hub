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
export const rulesetAPI = {
  create: async (payload: any) => {
    return apiRequest('/mwn/create_ruleset', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};