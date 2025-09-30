/**
 * Apollo Client Configuration
 * 
 * This file sets up the Apollo Client for GraphQL communication with the backend.
 * The client is configured to connect to the local GraphQL server.
 * 
 * Features:
 * - InMemoryCache for efficient data caching
 * - Configurable URI for different environments
 * 
 * @author MetaWare Development Team
 * @version 1.0.0
 */

import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

/**
 * HTTP Link configuration for GraphQL endpoint
 * Enhanced with error handling and connection management
 */
const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
  credentials: 'include',
});

/**
 * Apollo Client instance with enhanced caching and connection management
 * 
 * Features:
 * - Optimized cache merge strategies to prevent duplicate requests
 * - Query deduplication to reduce database load
 * - Enhanced error handling with 'all' policy
 * - Intelligent cache-first strategy after initial load
 */
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Merge strategy for namespace queries - always use incoming data
          meta_namespace: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          // Merge strategy for subject area queries
          meta_subjectarea: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          // Merge strategy for entity queries
          meta_entity: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          // Merge strategy for meta queries
          meta: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      fetchPolicy: 'network-only', // Always fetch fresh data
      nextFetchPolicy: 'cache-first', // Use cache for subsequent requests
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'network-only',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  // Enable query deduplication to prevent simultaneous identical queries
  queryDeduplication: true,
});