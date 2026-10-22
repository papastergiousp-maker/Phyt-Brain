// src/ai/genkit.ts
import { genkit, type Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { serverConfig } from '@/config/server-config';

// This is the global AI instance. It is initialized only once.
let aiInstance: Genkit | undefined;

/**
 * A lazy-loaded, singleton accessor for the global Genkit AI instance.
 * This ensures that the AI is configured only once and can be safely
 * imported and used across different parts of the application, including
 * server components, API routes, and Genkit's own dev UI, without causing
 * re-initialization errors.
 */
export function getGlobalAi(): Genkit {
  if (!aiInstance) {
    aiInstance = genkit({
      plugins: [
        googleAI({ 
          apiKey: serverConfig.geminiApiKey,
          apiVersion: 'v1', // Force the stable v1 API
        })
      ],
    });
  }
  return aiInstance;
}
