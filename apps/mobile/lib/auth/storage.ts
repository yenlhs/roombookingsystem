import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "supabase.auth.token";

export const authStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key);
      console.log(
        `[AuthStorage] Getting item for key: ${key}, found: ${!!value}`,
      );
      return value;
    } catch (error) {
      console.error(`[AuthStorage] Error getting item for key: ${key}`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
      console.log(`[AuthStorage] Stored item for key: ${key}`);
    } catch (error) {
      console.error(`[AuthStorage] Error setting item for key: ${key}`, error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
      console.log(`[AuthStorage] Removed item for key: ${key}`);
    } catch (error) {
      console.error(`[AuthStorage] Error removing item for key: ${key}`, error);
    }
  },
};

// Export token key for use in Supabase client
export { TOKEN_KEY };
