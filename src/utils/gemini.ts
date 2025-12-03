import { GoogleGenAI } from '@google/genai';

// Helper to get all available API keys from environment variables
const getApiKeys = (): string[] => {
  const keys: string[] = [];
  
  // Check for the primary key
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    keys.push(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  }

  // Check for numbered keys (e.g., NEXT_PUBLIC_GEMINI_API_KEY_1, _2, etc.)
  let i = 1;
  while (true) {
    const key = process.env[`NEXT_PUBLIC_GEMINI_API_KEY_${i}`];
    if (key) {
      keys.push(key);
      i++;
    } else {
      // Stop checking if a number is skipped or we run out
      // (Assuming user numbers them sequentially)
      if (i > 10) break; // Safety break
      // If we miss _1 but have _2, we might miss it with this logic if strict, 
      // but usually users number sequentially. 
      // Let's try to look a bit ahead just in case, or just rely on sequential.
      // For simplicity, let's assume sequential or just check a fixed range.
      // Let's check up to 10 keys.
      if (!key && i < 5) {
          i++; 
          continue;
      }
      break;
    }
  }

  // Remove duplicates
  return Array.from(new Set(keys));
};

export class GeminiClientManager {
  private keys: string[];
  private currentKeyIndex: number;

  constructor() {
    this.keys = getApiKeys();
    if (this.keys.length === 0) {
      console.warn("No Gemini API keys found in environment variables.");
    }
    // Randomize start index to distribute load if multiple clients are created (e.g. across users)
    // But for a single client app, round robin is fine.
    this.currentKeyIndex = 0;
  }

  private getNextKey(): string {
    if (this.keys.length === 0) throw new Error("No API keys available.");
    const key = this.keys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
    return key;
  }

  public async generateContentStreamWithRetry(
    modelName: string,
    params: any,
    retryCount = 0
  ): Promise<any> {
    const maxRetries = this.keys.length; // Try each key once
    
    // We try with the current key first (or the next one if we are retrying)
    // Actually, for the *first* attempt we might want to just use the current one.
    // If it fails, we rotate.
    
    // Let's implement a loop instead of recursion to be cleaner with the key rotation
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const apiKey = this.keys[this.currentKeyIndex]; // Use current key
      
      try {
        const ai = new GoogleGenAI({
          vertexai: false,
          apiKey: apiKey,
        });

        // Create the stream
        const response = await ai.models.generateContentStream({
            model: modelName,
            ...params
        });
        
        // If successful, we return the response. 
        // Note: The stream itself might fail mid-way, but usually 429 happens at connection.
        return response;

      } catch (error: any) {
        lastError = error;
        
        // Check if it's a rate limit error (429) or potentially 503 (overloaded)
        const isRateLimit = 
            error.message?.includes('429') || 
            error.status === 429 ||
            error.code === 429 ||
            error.message?.includes('Quota exceeded') ||
            error.message?.includes('Resource has been exhausted');

        if (isRateLimit) {
            console.warn(`Gemini API Rate Limit hit on key ending in ...${apiKey.slice(-4)}. Rotating key...`);
            // Rotate to next key for the next attempt
            this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
            continue; // Try again with new key
        }

        // If it's another error (e.g. 400 Bad Request), we probably shouldn't retry blindly
        throw error;
      }
    }

    throw new Error(`All API keys exhausted. Last error: ${lastError?.message}`);
  }
}

// Singleton instance for the app
export const geminiManager = new GeminiClientManager();
