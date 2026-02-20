import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

/**
 * Hook do dodawania dwóch liczb
 * 
 * Usage:
 *   const { result, loading, error, add } = useAddNumbers();
 *   await add(5, 10);
 */
export const useAddNumbers = () => {
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = useCallback(async (a: number, b: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.call<number>("add_numbers", [a, b]);
      setResult(res);
      return res;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, add };
};
