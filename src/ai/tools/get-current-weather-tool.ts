// src/ai/tools/get-current-weather-tool.ts
'use server';

import { getRealTimeWeather } from '@/actions/weather-actions';
import type { GetCurrentWeatherInput, GetCurrentWeatherOutput } from './get-current-weather-tool-types';
import { getGlobalAi } from '@/ai/genkit';
import { getCurrentWeatherToolDef } from './get-current-weather-tool-types';

export async function getCurrentWeatherToolFunc(input: GetCurrentWeatherInput): Promise<GetCurrentWeatherOutput> {
  if (input.latitude === undefined || input.longitude === undefined) {
    return { weatherSummary: `Σφάλμα: Δεν δόθηκαν οι συντεταγμένες (latitude, longitude). Ενημερώστε τον χρήστη ότι χρειάζεται να παρέχει την τοποθεσία του.` };
  }
  
  const weatherResult = await getRealTimeWeather({ lat: input.latitude, lon: input.longitude });

  if ('error' in weatherResult) {
    // This is now the key part. We return a clear, user-facing error message.
    // The main flow can then decide how to present this.
    // The error message from getRealTimeWeather is already user-friendly.
    return { weatherSummary: `Error fetching weather: ${weatherResult.error}` };
  }

  if (weatherResult.forecast.length > 0) {
    const currentDay = weatherResult.forecast[0];
    let summary = `Current weather for location (Lat: ${input.latitude.toFixed(2)}, Lon: ${input.longitude.toFixed(2)})`;
    if (weatherResult.locationName && weatherResult.locationName !== "Άγνωστη Τοποθεσία") {
      summary = `Current weather in ${weatherResult.locationName}`;
    }
    
    summary += `: Temp: ${currentDay.temp}, Condition: ${currentDay.condition}.`;
    if (currentDay.precipitation) {
      summary += ` ${currentDay.precipitation}.`;
    }
    if (currentDay.details && currentDay.day === "Σήμερα") {
       if (!currentDay.condition.toLowerCase().includes(currentDay.details.toLowerCase())) {
          summary += ` Details: ${currentDay.details}.`;
       }
    }
    return { weatherSummary: summary };
  }

  return { weatherSummary: 'Could not retrieve detailed weather information for the location.' };
}

// Define and export the tool using the singleton AI instance
export const getCurrentWeatherTool = getGlobalAi().defineTool(
  getCurrentWeatherToolDef,
  getCurrentWeatherToolFunc
);
