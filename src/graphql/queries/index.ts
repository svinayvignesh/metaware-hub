/**
 * GraphQL Queries Index
 * 
 * This file serves as a centralized export point for all GraphQL queries
 * used throughout the MetaWare application. It provides a single import
 * location for components that need access to multiple query sets.
 * 
 * Organization:
 * - Each query type is organized in its own file for maintainability
 * - All queries, types, and interfaces are re-exported here
 * - Follows domain-driven design principles
 * 
 * @author MetaWare Development Team
 * @version 1.0.0
 */

// Namespace-related queries and types
export {
  GET_NAMESPACES,
  type Namespace,
  type GetNamespacesResponse,
  type GetNamespacesVariables,
} from './namespace';

// Subject Area-related queries and types
export {
  GET_SUBJECTAREAS,
  type SubjectArea,
  type SubjectAreaNamespace,
  type GetSubjectAreasResponse,
  type GetSubjectAreasVariables,
} from './subjectarea';

// Entity-related queries and types
export {
  GET_ENTITIES,
  type Entity,
  type EntityNamespace,
  type EntitySubjectArea,
  type GetEntitiesResponse,
  type GetEntitiesVariables,
} from './entity';

// Meta (field-level) queries and types
export {
  GET_META_FOR_ENTITY,
  type MetaField,
  type GetMetaForEntityResponse,
  type GetMetaForEntityVariables,
} from './meta';

// Ruleset-related queries and types
export {
  GET_META_RULESETS,
  type Rule,
  type Ruleset,
  type GetMetaRulesetsResponse,
  type GetMetaRulesetsVariables,
} from './ruleset';

// Conceptual Model-related queries and types
export {
  GET_CONCEPTUAL_MODEL,
  GET_META_CONCEPTUAL,
  type ConceptualModel,
  type ConceptualModelMeta,
  type AssociatedSourceEntity,
  type MetaConceptualField,
  type GetConceptualModelResponse,
  type GetConceptualModelVariables,
  type GetMetaConceptualResponse,
  type GetMetaConceptualVariables,
} from './conceptualmodel';