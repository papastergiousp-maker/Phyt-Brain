// src/config/server-config.ts
import "dotenv/config";

// This file reads server-side environment variables and makes them
// available in a type-safe way. It prevents process.env from being
// scattered across the codebase.

// IMPORTANT: This file should NOT be imported into client-side components.

const geminiApiKey = process.env.GEMINI_API_KEY;
const weatherApiKey = process.env.WEATHER_API_KEY;

if (!geminiApiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not set in the environment variables.");
}

if (!weatherApiKey) {
    console.warn("WARNING: WEATHER_API_KEY is not set in the environment variables.");
}

export const serverConfig = {
  geminiApiKey: geminiApiKey,
  weatherApiKey: weatherApiKey,
};
