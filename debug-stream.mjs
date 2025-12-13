import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function main() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No API key found!');
    process.exit(1);
  }

  const ai = new GoogleGenAI({
    vertexai: false,
    apiKey: apiKey,
  });

  console.log('Sending request...');
  try {
    const result = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hello, say hi.' }] }],
    });

    console.log('Result type:', typeof result);
    // console.log('Result keys:', Object.keys(result));

    console.log('Iterating stream...');
    for await (const chunk of result) {
      console.log('Chunk keys:', Object.keys(chunk));
      console.log('Chunk structure:', JSON.stringify(chunk, null, 2));
      
      if (typeof chunk.text === 'function') {
        console.log('chunk.text() exists and returns:', chunk.text());
      } else {
        console.log('chunk.text is NOT a function. It is:', typeof chunk.text);
      }
      break; // Just need one chunk
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
