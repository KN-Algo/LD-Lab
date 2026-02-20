import React, { createContext, useContext, useCallback, useRef, type ReactNode } from "react";
import { apiClient } from "@/lib/api-client";

/**
 * Represents a single variable value and metadata
 */
interface VariableData {
  name: string;
  type: "BOOL" | "INT" | "FLOAT";
  value: number;
}

/**
 * Context value shape
 */
interface VariableContextType {
  variables: Record<string, VariableData>;
  loading: boolean;
  error: string | null;
  subscribe: (varName: string) => Promise<void>;
  unsubscribe: (varName: string) => Promise<void>;
  getVariable: (varName: string) => VariableData | undefined;
  getAllVariables: () => Promise<Record<string, VariableData>>;
  // Global subscription cache
  getSubscriptionId: (varName: string) => number | undefined;
}

/**
 * Create the context with default values
 */
const VariableContext = createContext<VariableContextType | undefined>(
  undefined
);

/**
 * Provider component
 */
interface VariableProviderProps {
  children: ReactNode;
}

export const VariableProvider: React.FC<VariableProviderProps> = ({
  children,
}) => {
  const [variables, setVariables] = React.useState<Record<string, VariableData>>(
    {}
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // Global cache for subscription IDs - persists across remounts  
  const subscriptionIdsRef = useRef<Map<string, number>>(new Map());

  const subscribe = useCallback(
    async (varName: string) => {
      try {
        setError(null);
        const subId = await apiClient.call<number>("subscribe_variable", [
          varName,
        ]);

        if (subId && subId !== -1) {
          subscriptionIdsRef.current.set(varName, subId);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
      }
    },
    []
  );

  const unsubscribe = useCallback(async (varName: string) => {
    try {
      const subId = subscriptionIdsRef.current.get(varName);
      if (subId !== undefined) {
        await apiClient.call<void>("unsubscribe_variable", [subId]);
        subscriptionIdsRef.current.delete(varName);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
    }
  }, []);

  const getVariable = useCallback(
    (varName: string): VariableData | undefined => {
      return variables[varName];
    },
    [variables]
  );

  const getAllVariables = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.call<
        Record<string, VariableData>
      >("get_all_variables", []);

      if (response) {
        // Assuming the response has a 'variables' property
        const allVars = (response as any).variables || response;
        setVariables(allVars);
        return allVars;
      }

      return {};
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const getSubscriptionId = useCallback(
    (varName: string): number | undefined => {
      return subscriptionIdsRef.current.get(varName);
    },
    []
  );

  const value: VariableContextType = {
    variables,
    loading,
    error,
    subscribe,
    unsubscribe,
    getVariable,
    getAllVariables,
    getSubscriptionId,
  };

  return (
    <VariableContext.Provider value={value}>
      {children}
    </VariableContext.Provider>
  );
};

/**
 * Hook to access the Variable Context
 *
 * Usage:
 * ```tsx
 * const { variables, getAllVariables, subscribe } = useVariableContext();
 * ```
 *
 * @throws Error if used outside of VariableProvider
 */
export const useVariableContext = (): VariableContextType => {
  const context = useContext(VariableContext);

  if (context === undefined) {
    throw new Error(
      "useVariableContext must be used within a VariableProvider"
    );
  }

  return context;
};

/**
 * Hook to subscribe to specific variables
 *
 * Usage:
 * ```tsx
 * const { value, loading, error } = useVariable("counter");
 * ```
 */
export const useVariable = (
  varName: string
): { value: number | null; loading: boolean; error: string | null } => {
  const { variables, loading, error, subscribe } =
    useVariableContext();
  const [subscribed, setSubscribed] = React.useState(false);

  React.useEffect(() => {
    if (!subscribed) {
      void subscribe(varName);
      setSubscribed(true);
    }
  }, [varName, subscribe, subscribed]);

  const variable = variables[varName];

  return {
    value: variable?.value ?? null,
    loading,
    error,
  };
};
