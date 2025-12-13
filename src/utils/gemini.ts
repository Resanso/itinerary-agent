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
    params: any
  ): Promise<any> {
    const modelsToTry = [modelName];
    // If the requested model is 2.0-flash, add valid fallbacks from the available list
    if (modelName === 'gemini-2.0-flash') {
        modelsToTry.push('gemini-2.0-flash-lite');
        modelsToTry.push('gemini-2.5-flash');
    }

    let globalLastError;

    // Outer loop: iterate through models (primary -> fallback)
    for (const currentModel of modelsToTry) {
        const maxRetries = this.keys.length; // Try each key once for the current model
        let lastErrorForModel;

        // Inner loop: iterate through API keys
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const apiKey = this.keys[this.currentKeyIndex]; // Use current key

            try {
                const ai = new GoogleGenAI({
                    vertexai: false,
                    apiKey: apiKey,
                });

                // Create the stream
                const response = await ai.models.generateContentStream({
                    model: currentModel,
                    ...params
                });

                // If successful (and we are on a fallback), log it
                if (currentModel !== modelName) {
                    console.info(`Successfully generated content using fallback model: ${currentModel}`);
                }
                
                return response;

            } catch (error: any) {
                lastErrorForModel = error;
                globalLastError = error;

                // Check if it's a rate limit error (429) or potentially 503 (overloaded)
                const isRateLimit =
                    error.message?.includes('429') ||
                    error.status === 429 ||
                    error.code === 429 ||
                    error.message?.includes('Quota exceeded') ||
                    error.message?.includes('Resource has been exhausted');

                if (isRateLimit) {
                    console.warn(`[${currentModel}] Rate Limit hit on key ending in ...${apiKey.slice(-4)}. Rotating key...`);
                    // Rotate to next key for the next attempt
                    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
                    continue; // Try again with new key
                }

                // If it's another error (e.g. 400 Bad Request), we probably shouldn't retry blindly,
                // BUT if it's a model-specific 404 or 400 (e.g. model not found or params not supported), 
                // we might want to let the outer loop try the fallback? 
                // For safety, let's only strictly retry on Rate Limits or Server Errors for now.
                throw error;
            }
        }
        
        console.warn(`All keys exhausted for model ${currentModel}. Checking for fallback model...`);
    }

    throw new Error(`All API keys and fallback models exhausted. Last error: ${globalLastError?.message}`);
  }
}

// Singleton instance for the app
export const geminiManager = new GeminiClientManager();
