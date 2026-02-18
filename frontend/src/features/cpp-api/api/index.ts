import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

/**
 * Hook do dodawania wielu liczb
 * 
 * Usage:
 *   const { sum, loading, error, addMany } = useAddMany();
 *   await addMany([1, 2, 3, 4, 5]);
 */
export const useAddMany = () => {
  const [sum, setSum] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMany = useCallback(async (numbers: number[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.call<number>("add_many", [numbers]);
      setSum(res);
      return res;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { sum, loading, error, addMany };
};

/**
 * Export all API hooks for easier imports
 */
export * from "./use-greeter";
export * from "./use-add-numbers";
