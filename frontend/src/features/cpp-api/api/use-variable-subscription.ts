import { useState, useCallback, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { subscriptionCache } from "@/lib/subscription-cache";

/**
 * Single variable subscription record
 */
interface VariableData {
  name: string;
  type: "BOOL" | "INT" | "FLOAT";
  value: number;
}

/**
 * Hook for subscribing to variable changes
 *
 * Provides polling-based real-time monitoring of C++ variables.
 * Automatically polls every pollInterval milliseconds.
 *
 * Usage:
 * ```tsx
 * const { variables, loading, error, subscribe, unsubscribe, pollInterval } = 
 *   useVariableSubscription(["flag", "counter", "temperature"], 100);
 *
 * // Get single variable
 * const value = variables["counter"]?.value;
 *
 * // Change poll frequency
 * pollInterval.setPollMs(50);  // Poll every 50ms
 * ```
 */
export const useVariableSubscription = (
  varNames: string[] = [],
  initialPollMs: number = 200
) => {
  const [variables, setVariables] = useState<Record<string, VariableData>>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollMs, setPollMs] = useState(initialPollMs);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subscribedVarsRef = useRef<Set<string>>(new Set());
  const hasInitializedRef = useRef(false);

  /**
   * Subscribe to a single variable
   */
  const subscribe = useCallback(
    async (varName: string) => {
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
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
      }
    },
    []
  );

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
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
    }
  }, []);

  /**
   * Poll variables for updates
   */
  const pollVariables = useCallback(async () => {
    if (varNames.length === 0) return;

    setError(null);

    try {
      const updates: Record<string, VariableData> = {};

      // Fetch each variable individually
      for (const varName of varNames) {
        const result = await apiClient.call<VariableData>("get_variable", [
          varName,
        ]);

        if (result && result.name !== "ERROR") {
          updates[varName] = result;
        }
      }

      // Update only if any value changed
      setVariables((prevVariables) => {
        let hasChanges = false;
        for (const varName in updates) {
          const prev = prevVariables[varName];
          if (!prev || prev.value !== updates[varName].value) {
            hasChanges = true;
            break;
          }
        }
        return hasChanges ? updates : prevVariables;
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
    }
  }, [varNames]);

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
          try {
            const subId = await apiClient.call<number>("subscribe_variable", [
              varName,
            ]);
            if (subId && subId !== -1) {
              subscriptionCache.set(varName, subId);
              currentSubscribed.add(varName);
            }
          } catch (err) {
            console.error(`Failed to subscribe to ${varName}`, err);
          }
        }
      }

      // Mark initial loading complete after first subscription
      if (!hasInitializedRef.current && varNames.length > 0) {
        setInitialLoading(false);
        hasInitializedRef.current = true;
      }
    };

    subscribeAll();

    // NOTE: We intentionally do NOT unsubscribe on unmount
    // Subscription IDs are cached globally, so the same variable
    // always has the same ID throughout the app lifetime
    // This prevents duplicate subscriptions and wasted IDs
  }, [varNames]);

  /**
   * Set up polling interval
   */
  useEffect(() => {
    // Initial poll
    void pollVariables();

    // Set up polling
    pollIntervalRef.current = setInterval(() => {
      void pollVariables();
    }, pollMs);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [pollVariables, pollMs]);

  return {
    variables,
    loading: initialLoading,
    error,
    subscribe,
    unsubscribe,
    // Function to update poll interval
    pollInterval: {
      getPollMs: () => pollMs,
      setPollMs: (ms: number) => {
        if (ms > 0) {
          setPollMs(ms);
        }
      },
    },
  };
};
