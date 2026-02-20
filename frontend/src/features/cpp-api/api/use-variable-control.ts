import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

/**
 * Hook for controlling/setting variable values and creating new variables
 * 
 * Allows creating and setting variables from the frontend
 * 
 * Usage:
 * ```tsx
 * // Creating a variable
 * const { createVariable, setValue, loading, error } = useVariableControl();
 * await createVariable("myCounter", "INT", 0);
 * 
 * // Setting a variable
 * await setValue("myCounter", "INT", 42);
 * ```
 */
export const useVariableControl = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new variable on the backend
   */
  const createVariable = useCallback(
    async (
      name: string,
      type: "BOOL" | "INT" | "FLOAT",
      initialValue: number
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.call<boolean>("create_variable", [
          name,
          type,
          initialValue,
        ]);
        
        if (!result) {
          throw new Error(`Failed to create variable '${name}'`);
        }
        
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Set a variable value
   */
  const setValue = useCallback(
    async (
      name: string,
      type: "BOOL" | "INT" | "FLOAT",
      value: number
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.call<boolean>("set_variable", [
          name,
          type,
          value,
        ]);
        
        if (!result) {
          throw new Error(`Failed to set variable '${name}'`);
        }
        
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    createVariable,
    setValue,
    loading,
    error,
  };
};
