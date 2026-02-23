import { call } from "@saucer-dev/types";

declare global {
    interface Window {
        binaryUpdate?: (base64Data: string) => void;
        onVariableChange?: (name: string, type: string, value: number) => void;
    }
}

// Decode base64 to Uint8Array
export function base64ToUint8Array(base64: string): Uint8Array {
    // Remove any whitespace or newlines that might have snuck in
    const cleanBase64 = base64.replace(/[^A-Za-z0-9+/=]/g, "");
    const binaryString = atob(cleanBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

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
