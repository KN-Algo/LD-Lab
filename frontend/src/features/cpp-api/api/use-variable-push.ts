import { useState, useCallback, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { subscriptionCache } from "@/lib/subscription-cache";

/**
 * Single variable data from backend
 */
interface VariableData {
  name: string;
  type: "BOOL" | "INT" | "FLOAT";
  value: number;
}

/**
 * Global window interface for variable change callbacks
 */
declare global {
  interface Window {
    onVariableChange?: (name: string, type: string, value: number) => void;
    __variableChangeListeners?: Map<string, Set<(data: VariableData) => void>>;
  }
}

/**
 * Hook for real-time variable updates using WebSocket/Push notifications
 * 
 * **Phase 2 Implementation** - Push-based instead of polling
 * 
 * Automatically subscribes to backend variable changes and receives
 * real-time updates via JavaScript callbacks (no polling needed).
 * 
 * Usage:
 * ```tsx
 * const { variables, loading, error, subscribe, unsubscribe } = 
 *   useVariablePush(["flag", "counter", "temperature"]);
 * 
 * // Get single variable
 * const value = variables["counter"]?.value;
 * 
 * // Manually subscribe to new variable
 * await subscribe("newVariable");
 * ```
 */
export const useVariablePush = (varNames: string[] = []) => {
  const [variables, setVariables] = useState<Record<string, VariableData>>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscribedVarsRef = useRef<Set<string>>(new Set());
  const hasInitializedRef = useRef(false);

  /**
   * Subscribe to a single variable
   */
  const subscribe = useCallback(async (varName: string) => {
    // Already subscribed
    if (subscriptionCache.has(varName)) {
      subscribedVarsRef.current.add(varName);
      return;
    }

    try {
      setError(null);
      const subId = await apiClient.call<number>("subscribe_variable", [
        varName,
      ]);

      if (subId && subId !== -1) {
        subscriptionCache.set(varName, subId);
        subscribedVarsRef.current.add(varName);

        // Fetch initial value
        const initialValue = await apiClient.call<VariableData>(
          "get_variable",
          [varName]
        );
        if (initialValue && initialValue.name !== "ERROR") {
          setVariables((prev) => ({
            ...prev,
            [varName]: initialValue,
          }));
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
    }
  }, []);

  /**
   * Unsubscribe from a single variable
   */
  const unsubscribe = useCallback(async (varName: string) => {
    try {
      const subId = subscriptionCache.get(varName);
      if (subId !== undefined) {
        await apiClient.call<void>("unsubscribe_variable", [subId]);
        subscriptionCache.delete(varName);
        subscribedVarsRef.current.delete(varName);

        // Remove from state
        setVariables((prev) => {
          const newVars = { ...prev };
          delete newVars[varName];
          return newVars;
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
    }
  }, []);

  /**
   * Setup global window callback handler for push notifications
   */
  useEffect(() => {
    // Initialize global listener map
    if (!window.__variableChangeListeners) {
      window.__variableChangeListeners = new Map();
    }

    // Setup global window callback (once)
    if (!window.onVariableChange) {
      window.onVariableChange = (name: string, type: string, value: number) => {
        const listeners = window.__variableChangeListeners?.get(name);
        if (listeners) {
          const data: VariableData = {
            name,
            type: type as "BOOL" | "INT" | "FLOAT",
            value,
          };
          listeners.forEach((listener) => listener(data));
        }
      };
    }

    // Create listener for this hook instance
    const listener = (data: VariableData) => {
      setVariables((prev) => {
        // Only update if value changed
        if (prev[data.name]?.value === data.value) {
          return prev;
        }
        return {
          ...prev,
          [data.name]: data,
        };
      });
    };

    // Register listeners for all subscribed variables
    subscribedVarsRef.current.forEach((varName) => {
      if (!window.__variableChangeListeners!.has(varName)) {
        window.__variableChangeListeners!.set(varName, new Set());
      }
      window.__variableChangeListeners!.get(varName)!.add(listener);
    });

    // Cleanup
    return () => {
      subscribedVarsRef.current.forEach((varName) => {
        window.__variableChangeListeners?.get(varName)?.delete(listener);
      });
    };
  }, []);

  /**
   * Subscribe to all variables on mount and handle var changes
   */
  useEffect(() => {
    const subscribeAll = async () => {
      const currentSubscribed = subscribedVarsRef.current;
      const newVarsSet = new Set(varNames);

      // Unsubscribe from removed variables
      for (const varName of currentSubscribed) {
        if (!newVarsSet.has(varName)) {
          const subId = subscriptionCache.get(varName);
          if (subId !== undefined) {
            try {
              await apiClient.call<void>("unsubscribe_variable", [subId]);
              subscriptionCache.delete(varName);
            } catch (err) {
              console.error(`Failed to unsubscribe from ${varName}`, err);
            }
          }
          currentSubscribed.delete(varName);
        }
      }

      // Subscribe to new variables
      for (const varName of varNames) {
        if (!currentSubscribed.has(varName)) {
          await subscribe(varName);
        }
      }

      // Mark initial loading complete after first subscription
      if (!hasInitializedRef.current && varNames.length > 0) {
        setInitialLoading(false);
        hasInitializedRef.current = true;
      }
    };

    subscribeAll();
  }, [varNames, subscribe]);

  /**
   * Register/unregister listeners when varNames changes
   */
  useEffect(() => {
    const listener = (data: VariableData) => {
      setVariables((prev) => {
        if (prev[data.name]?.value === data.value) {
          return prev;
        }
        return {
          ...prev,
          [data.name]: data,
        };
      });
    };

    // Register listeners for current variables
    varNames.forEach((varName) => {
      if (!window.__variableChangeListeners!.has(varName)) {
        window.__variableChangeListeners!.set(varName, new Set());
      }
      window.__variableChangeListeners!.get(varName)!.add(listener);
    });

    // Cleanup old listeners
    return () => {
      varNames.forEach((varName) => {
        window.__variableChangeListeners?.get(varName)?.delete(listener);
      });
    };
  }, [varNames]);

  return {
    variables,
    loading: initialLoading,
    error,
    subscribe,
    unsubscribe,
  };
};
