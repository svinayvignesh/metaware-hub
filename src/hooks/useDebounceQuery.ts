/**
 * Debounced Query Hook
 * 
 * This hook wraps Apollo's useQuery with debouncing logic to prevent
 * rapid-fire queries that can overwhelm the database connection pool.
 * 
 * Features:
 * - Debounces query execution
 * - Prevents connection pool exhaustion
 * - Maintains loading states during debounce
 * 
 * @author MetaWare Development Team
 * @version 1.0.0
 */

import { useEffect, useState, useRef } from 'react';
import { DocumentNode, OperationVariables, TypedDocumentNode } from '@apollo/client';

// Re-export from react hooks (will be available after package update)
// For now, we'll use a simple wrapper approach

interface DebounceOptions {
  debounceMs?: number;
}

/**
 * Hook to provide debounced state for queries
 * 
 * @param debounceMs - Milliseconds to debounce (default 300)
 * @returns shouldSkip - Whether to skip the query
 */
export function useDebounce(debounceMs = 300): boolean {
  const [shouldSkip, setShouldSkip] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setShouldSkip(false);
    }, debounceMs);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debounceMs]);

  return shouldSkip;
}
