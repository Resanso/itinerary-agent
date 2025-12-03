import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars manually since we are running a standalone script
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

async function listModels() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API Key found in .env.local");
    return;
  }

  console.log("Using API Key:", apiKey.substring(0, 5) + "...");

  const ai = new GoogleGenAI({
    vertexai: false,
    apiKey: apiKey,
  });

  try {
    console.log("Fetching available models...");
    // The SDK might not have a direct listModels on the client instance in the same way, 
    // but usually it's under models.
    // Based on documentation for @google/genai (if it matches google-generative-ai patterns or similar):
    // Actually @google/genai is the new one. Let's try to find the method.
    // If it fails, we will know.
    
    // For the new SDK, it might be ai.models.list() or similar.
    // Let's try to inspect or just make a simple call.
    // Since I can't easily browse docs, I'll try a standard generation with a very basic model 'gemini-pro' 
    // to see if that works, and also try to list if possible.
    
    // Attempt to list models if the method exists.
    // If not, I'll just try to generate with 'gemini-1.5-flash' again to see the error in this isolated context.
    
    // Note: The error message from user "Call ListModels to see the list" suggests the API supports it.
    // In the REST API it's GET /v1beta/models.
    // In the SDK, it might be ai.models.list().
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.models) {
        console.log("Available Models:");
        data.models.forEach(m => {
            if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                 console.log(`- ${m.name}`);
            }
        });
    } else {
        console.log("Could not list models via REST:", data);
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
