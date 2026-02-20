/**
 * Global subscription cache for variable streaming
 * 
 * Ensures that subscription IDs are reused across component remounts
 * So the same variable always has the same subscription ID throughout the app lifetime
 */

class SubscriptionCache {
  private cache: Map<string, number> = new Map();

  /**
   * Get subscription ID for a variable
   * Returns undefined if not subscribed yet
   */
  get(varName: string): number | undefined {
    return this.cache.get(varName);
  }

  /**
   * Set subscription ID for a variable
   */
  set(varName: string, subscriptionId: number): void {
    this.cache.set(varName, subscriptionId);
  }

  /**
   * Check if variable is already subscribed
   */
  has(varName: string): boolean {
    return this.cache.has(varName);
  }

  /**
   * Remove subscription ID for a variable
   */
  delete(varName: string): boolean {
    return this.cache.delete(varName);
  }

  /**
   * Clear all cached subscriptions
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get all subscription IDs
   */
  getAll(): Map<string, number> {
    return new Map(this.cache);
  }
}

// Global instance
export const subscriptionCache = new SubscriptionCache();
