
'use server';

import type { WeatherDay } from '@/components/weather/WeatherForecast'; 
import { serverConfig } from '@/config/server-config';

// Helper function to map API weather codes to our internal icon codes/names
function mapApiIconToAppIconCode(apiIconCode: string): string {
  if (apiIconCode.includes('01')) return 'Sun';
  if (apiIconCode.includes('02') || apiIconCode.includes('03') || apiIconCode.includes('04')) return 'Cloud';
  if (apiIconCode.includes('09') || apiIconCode.includes('10')) return 'CloudRain';
  if (apiIconCode.includes('11')) return 'CloudLightning';
  if (apiIconCode.includes('13')) return 'CloudSnow';
  if (apiIconCode.includes('50')) return 'CloudFog';
  return 'Sun';
}

// Helper function to transform API response, now timezone-aware
function transformApiDataToWeatherDayArray(apiData: any, count: number = 5): { forecast: WeatherDay[], locationName: string } | null {
  const locationName = apiData.city && apiData.city.name ? `${apiData.city.name}, ${apiData.city.country}` : "Άγνωστη Τοποθεσία";
  const timezoneOffset = apiData.city?.timezone ?? 0; // Offset from UTC in seconds

  if (!apiData.list || !Array.isArray(apiData.list)) {
    console.error("Unexpected API data structure for transformation (expected 'list' array):", apiData);
    return null; 
  }
  
  // Determine "today" and "tomorrow" at the location using the timezone offset from the API
  const now = new Date();
  const nowUtc = now.getTime() + (now.getTimezoneOffset() * 60000); // Get current time in UTC milliseconds
  const locationNow = new Date(nowUtc + (timezoneOffset * 1000));
  
  const todayAtLocation = locationNow.toISOString().split('T')[0];
  locationNow.setDate(locationNow.getDate() + 1);
  const tomorrowAtLocation = locationNow.toISOString().split('T')[0];

  const dailyDataPoints: { [key: string]: any[] } = {};
  apiData.list.forEach((item: any) => {
    // Group by UTC date using dt_txt for consistency
    const dateKey = item.dt_txt.split(' ')[0];
    if (!dailyDataPoints[dateKey]) {
      dailyDataPoints[dateKey] = [];
    }
    dailyDataPoints[dateKey].push(item);
  });

  const sortedDates = Object.keys(dailyDataPoints).sort();
  const forecastDays: WeatherDay[] = [];
  
  for (const dateKey of sortedDates) {
    if (forecastDays.length >= count) break;

    const dayForecasts = dailyDataPoints[dateKey];
    if (!dayForecasts || dayForecasts.length === 0) continue;

    const isToday = dateKey === todayAtLocation;
    let selectedForecast;

    if (isToday) {
      // For today, the first item in the list is the most relevant upcoming forecast
      selectedForecast = dayForecasts[0];
    } else {
      // For future days, try to get the noon (UTC) forecast for consistency.
      // Fallback to the middle forecast of the day if noon is not available.
      selectedForecast = dayForecasts.find(f => f.dt_txt.includes("12:00:00")) || dayForecasts[Math.floor(dayForecasts.length / 2)];
    }
    
    if (!selectedForecast) continue;

    let dayName;
    if (isToday) {
      dayName = 'Σήμερα';
    } else if (dateKey === tomorrowAtLocation) {
      dayName = 'Αύριο';
    } else {
      // Use timeZone: 'UTC' to get correct day name regardless of server's timezone
      const dateFromKey = new Date(`${dateKey}T12:00:00Z`); 
      dayName = dateFromKey.toLocaleDateString('el-GR', { weekday: 'short', timeZone: 'UTC' });
      dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    }
    
    let precipitationText: string | undefined = undefined;
    if (selectedForecast.pop !== undefined && selectedForecast.pop > 0) { 
        precipitationText = `Πιθ. Βροχής: ${Math.round(selectedForecast.pop * 100)}%`;
    }
    if (selectedForecast.rain && selectedForecast.rain['3h']) {
        precipitationText = `${selectedForecast.rain['3h'].toFixed(1)} mm`; 
    }

    forecastDays.push({
      day: dayName,
      temp: `${Math.round(selectedForecast.main.temp)}°C`,
      condition: selectedForecast.weather[0]?.description?.toUpperCase() || 'N/A',
      iconCode: mapApiIconToAppIconCode(selectedForecast.weather[0]?.icon || '01d'),
      details: isToday ? (selectedForecast.weather[0]?.description || '') : undefined,
      rawTemp: Math.round(selectedForecast.main.temp),
      precipitation: precipitationText,
    });
  }

  return { forecast: forecastDays, locationName };
}

export async function getRealTimeWeather(coords: { lat: number; lon: number }): Promise<{ forecast: WeatherDay[]; locationName: string; } | { error: string }> {
  const apiKey = serverConfig.weatherApiKey;
  const { lat, lon } = coords;

  if (!apiKey) {
    return { error: 'Το κλειδί API για τον καιρό (WEATHER_API_KEY) δεν έχει ρυθμιστεί στις μεταβλητές περιβάλλοντος του server.' };
  }
  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
    return { error: 'Οι συντεταγμένες (latitude, longitude) που δόθηκαν δεν είναι έγκυρες.' };
  }
  
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=el`;
  
  try {
    const maskedApiUrl = apiUrl.replace(apiKey, 'YOUR_API_KEY_HIDDEN');
    console.log(`Fetching weather from: ${maskedApiUrl} for lat: ${lat}, lon: ${lon}`);
    const response = await fetch(apiUrl, { next: { revalidate: 21600 } }); // Revalidate every 6 hours

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText || "Could not parse error response as JSON", cod: response.status.toString() };
      }
      console.error('Weather API Error Response:', { status: response.status, data: errorData, requestedUrl: maskedApiUrl });
      
      let errorMessage = `Σφάλμα από το API καιρού: ${response.status}`;
      if (errorData && errorData.message) {
        errorMessage += ` - ${errorData.message}`;
      }

      if (response.status === 401) {
        errorMessage = 'Σφάλμα από το API καιρού: Μη εξουσιοδοτημένη πρόσβαση. Ελέγξτε το WEATHER_API_KEY σας. Βεβαιωθείτε ότι είναι σωστό και ενεργό.';
      } else if (response.status === 400 && errorData && errorData.message && errorData.message.toLowerCase().includes('wrong latitude')) {
        errorMessage = 'Σφάλμα API Καιρού: Λανθασμένο γεωγραφικό πλάτος.';
      } else if (response.status === 400 && errorData && errorData.message && errorData.message.toLowerCase().includes('wrong longitude')) {
        errorMessage = 'Σφάλμα API Καιρού: Λανθασμένο γεωγραφικό μήκος.';
      } else if (response.status === 404) {
        errorMessage = 'Σφάλμα από το API καιρού: Η τοποθεσία δεν βρέθηκε βάσει των συντεταγμένων που δόθηκαν.';
      } else if (response.status === 429) {
        errorMessage = 'Έχετε υπερβεί το όριο κλήσεων για την υπηρεσία καιρού. Παρακαλούμε δοκιμάστε ξανά αργότερα.';
      } else if (errorData && errorData.message) {
         errorMessage = `Σφάλμα API Καιρού: ${errorData.message}`;
      }
      return { error: errorMessage };
    }

    const data = await response.json();
    const transformedData = transformApiDataToWeatherDayArray(data);

    if (transformedData) {
      return transformedData;
    } else {
      // This case implies an issue with the structure of 'data' itself, after a successful API call.
      const structureError = "Απέτυχε η επεξεργασία των δεδομένων καιρού από το API (δομή).";
      console.error(structureError, data);
      return { error: structureError };
    }

  } catch (error: any) {
    console.error('Σφάλμα κατά την ανάκτηση δεδομένων καιρού:', error);
    if (error.message && error.message.includes('fetch failed')) {
      return { error: 'Σφάλμα δικτύου κατά την προσπάθεια ανάκτησης δεδομένων καιρού. Ελέγξτε τη σύνδεσή σας ή το API endpoint.' };
    }
    return { error: error.message || 'Άγνωστο σφάλμα κατά την ανάκτηση δεδομένων καιρού.' };
  }
}
