
// src/ai/tools/get-current-weather-tool-types.ts
// This file does NOT have 'use server';
// It contains Zod schemas, TypeScript types, and the tool definition for getCurrentWeatherTool.

import { z } from 'zod';

export const GetCurrentWeatherInputSchema = z.object({
  latitude: z.number().optional().describe('The latitude for the weather forecast.'),
  longitude: z.number().optional().describe('The longitude for the weather forecast.'),
});
export type GetCurrentWeatherInput = z.infer<typeof GetCurrentWeatherInputSchema>;

export const GetCurrentWeatherOutputSchema = z.object({
  weatherSummary: z
    .string()
    .describe(
      'A concise summary of the current weather conditions including temperature, general condition, and any precipitation, or an error message if weather data could not be fetched.'
    ),
});
export type GetCurrentWeatherOutput = z.infer<typeof GetCurrentWeatherOutputSchema>;

export const getCurrentWeatherToolDef = {
  name: 'getCurrentWeatherTool',
  description: 'Fetches the current weather forecast for a specific latitude and longitude. Use this tool if the user asks about current weather conditions or if their query would benefit from real-time weather information (e.g., for planting advice, pest/disease risk assessment based on humidity/temperature).',
  inputSchema: GetCurrentWeatherInputSchema,
  outputSchema: GetCurrentWeatherOutputSchema,
};
