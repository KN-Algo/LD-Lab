import { call } from "@saucer-dev/types";

/**
 * API Client - Single instance to handle all Saucer API calls
 * Patterns inspired by bulletproof-react
 * 
 * Usage:
 *   const result = await apiClient.get("function_name", [arg1, arg2]);
 */
class ApiClient {
  /**
   * Wywołuje funkcję C++ przez Saucer
   * @param endpoint - Nazwa funkcji zarejestrowanej w C++
   * @param args - Argumenty do przekazania funkcji
   * @returns Promise z wynikiem
   */
  async call<T = unknown>(endpoint: string, args: unknown[]): Promise<T> {
    try {
      const result = await call<T>(endpoint, args);
      return result;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw new Error(`Failed to call ${endpoint}: ${error}`);
    }
  }
}

// Single instance of API client
export const apiClient = new ApiClient();
