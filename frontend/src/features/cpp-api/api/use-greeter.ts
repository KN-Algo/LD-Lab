import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

/**
 * Hook do wywołania hello_from_cpp
 * 
 * Usage:
 *   const { data, loading, error, call: callHello } = useGreeter();
 *   await callHello();
 */
export const useGreeter = () => {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.call<string>("hello_from_cpp", []);
      setData(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, call };
};
