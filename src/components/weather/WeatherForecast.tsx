
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Cloud, CloudRain, CloudSnow, Wind, Cloudy, ChevronDown, ChevronUp, Loader2, AlertCircle, CloudFog, CloudLightning, Snowflake, Thermometer, Eye, Settings, MapPin, Droplets, Umbrella } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getRealTimeWeather } from '@/actions/weather-actions';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export interface WeatherDay {
  day: string;
  temp: string;
  rawTemp: number;
  condition: string;
  iconCode: string;
  details?: string;
  precipitation?: string;
}

const iconMap: { [key: string]: LucideIcon } = {
  Sun, Cloud, CloudRain, CloudSnow, Wind, Cloudy, ChevronDown, ChevronUp, Loader2, AlertCircle, CloudFog, CloudLightning, Snowflake, Thermometer, Eye, Settings, MapPin, Droplets, Umbrella,
  '01d': Sun, '01n': Sun,
  '02d': Cloudy, '02n': Cloudy,
  '03d': Cloud, '03n': Cloud,
  '04d': Cloud, '04n': Cloud,
  '09d': CloudRain, '09n': CloudRain,
  '10d': CloudRain, '10n': CloudRain,
  '11d': CloudLightning, '11n': CloudLightning,
  '13d': Snowflake, '13n': Snowflake,
  '50d': CloudFog, '50n': CloudFog,
};

const getWeatherIconFromCode = (code: string | undefined): LucideIcon => {
  if (!code) return Sun;
  return iconMap[code] || Sun;
};

const awaitingLocationData: WeatherDay[] = Array(1).fill(null).map(() => ({
  day: 'Αναμονή',
  temp: '--°C',
  rawTemp: NaN,
  condition: 'Εντοπισμός...',
  iconCode: 'MapPin',
  details: 'Ο περιηγητής σας θα ζητήσει άδεια για την τοποθεσία.',
}));

const geolocationErrorData = (message: string): WeatherDay[] => Array(1).fill(null).map(() => ({
  day: 'Σφάλμα',
  temp: 'N/A',
  rawTemp: NaN,
  condition: 'Τοποθεσία',
  iconCode: 'AlertCircle',
  details: message,
}));

const configErrorData: WeatherDay[] = Array(1).fill(null).map(() => ({
  day: 'Ρύθμιση',
  temp: 'N/A',
  rawTemp: NaN,
  condition: 'Απαιτείται',
  iconCode: 'Settings',
  details: 'Λείπει το WEATHER_API_KEY.',
}));

const genericApiErrorData = (errorMsg: string): WeatherDay[] => Array(1).fill(null).map(() => ({
  day: 'Σφάλμα API',
  temp: 'N/A',
  rawTemp: NaN,
  condition: 'Δεδομένων',
  iconCode: 'AlertCircle',
  details: errorMsg.substring(0, 100),
}));

export function WeatherForecast() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [forecastData, setForecastData] = useState<WeatherDay[]>(awaitingLocationData);
  const [locationDisplay, setLocationDisplay] = useState<string | null>("Εντοπισμός...");
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigError, setIsConfigError] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchWeatherData = useCallback(async (lat: number, lon: number) => {
    setIsLoadingWeather(true);
    setError(null);
    setIsConfigError(false);

    try {
      const result = await getRealTimeWeather({ lat, lon });
      if ('error' in result) {
        const configErr = result.error.includes('WEATHER_API_KEY');
        setIsConfigError(configErr);
        setError(result.error);
        setLocationDisplay(configErr ? "Σφάλμα Ρύθμισης" : "Σφάλμα API");
        if (configErr) {
          setForecastData(configErrorData);
        } else {
          setForecastData(genericApiErrorData(result.error));
        }
      } else if (result && result.forecast && result.forecast.length > 0) {
        setForecastData(result.forecast);
        setLocationDisplay(result.locationName);
      } else {
        const noDataMsg = "Δεν επιστράφηκαν δεδομένα καιρού.";
        setError(noDataMsg);
        setLocationDisplay("Δεδομένα μη Διαθέσιμα");
        setForecastData(genericApiErrorData(noDataMsg));
      }
    } catch (err: any) {
      const catchErrorMsg = err.message || 'Άγνωστο σφάλμα.';
      setError(catchErrorMsg);
      setLocationDisplay("Σφάλμα Ανάκτησης");
      setForecastData(genericApiErrorData(catchErrorMsg));
    } finally {
      setIsLoadingWeather(false);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      setIsLoadingGeo(true);
      setLocationDisplay("Εντοπισμός...");
      setForecastData(awaitingLocationData);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setIsLoadingGeo(false);
          setError(null);
          fetchWeatherData(latitude, longitude);
        },
        (geoError) => {
          let errorMessage = 'Άγνωστο σφάλμα γεωγραφικού εντοπισμού.';
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              errorMessage = 'Η άδεια για την τοποθεσία απορρίφθηκε. Παρακαλώ ελέγξτε τις ρυθμίσεις τοποθεσίας του περιηγητή ή της συσκευής σας και ανανεώστε τη σελίδα.';
              break;
            case geoError.POSITION_UNAVAILABLE:
              errorMessage = 'Οι πληροφορίες τοποθεσίας δεν είναι διαθέσιμες.';
              break;
            case geoError.TIMEOUT:
              errorMessage = 'Το αίτημα για τη λήψη της τοποθεσίας έληξε.';
              break;
          }
          setError(errorMessage);
          setLocationDisplay("Σφάλμα Τοποθεσίας");
          setForecastData(geolocationErrorData(errorMessage));
          setIsLoadingGeo(false);
        }
      );
    }
  }, [isClient, fetchWeatherData]);

  if (!isClient) {
    return (
      <div className="relative w-full max-w-xs text-right">
        <div className="flex flex-col items-end p-1">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <p className="text-muted-foreground text-[9px]">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  const displayData = forecastData.length > 0 ? forecastData[0] : awaitingLocationData[0];
  const IconComponentToday = getWeatherIconFromCode(displayData.iconCode);
  const conditionText = isLoadingGeo ? "Εντοπισμός..." : displayData.condition;
  const tempText = isLoadingGeo ? "--°C" : displayData.temp;
  const precipitationText = displayData.precipitation;

  const showSpinner = isLoadingGeo || isLoadingWeather;
  
  const canExpand = !isLoadingGeo && !isLoadingWeather && !error && forecastData.length > 1 && !isConfigError;

  return (
    <div className="relative">
      <div 
        className={cn(
          'w-full max-w-xs text-right',
          'flex flex-col items-end p-1 rounded-md',
          canExpand ? 'cursor-pointer hover:bg-muted/30' : 'cursor-default'
        )}
        onClick={() => { if(canExpand) setIsExpanded(prev => !prev) }}
        role={canExpand ? "button" : undefined}
        tabIndex={canExpand ? 0 : -1}
        onKeyDown={(e) => { if(canExpand && (e.key === 'Enter' || e.key === ' ')) setIsExpanded(prev => !prev) }}
        aria-expanded={isExpanded}
        aria-controls="weekly-forecast-container"
      >
        {locationDisplay && (
          <div className="flex items-center text-muted-foreground text-[10px] self-end">
            <MapPin className="w-2.5 h-2.5 mr-0.5" />
            <span>{locationDisplay}</span>
          </div>
        )}

        {error && !isConfigError && !isLoadingGeo && (
          <Alert variant="destructive" className="my-1 p-1.5 text-left w-full">
            <AlertCircle className="h-2.5 w-2.5" />
            <AlertTitle className="text-[10px] font-semibold">Σφάλμα</AlertTitle>
            <AlertDescription className="text-[9px]">{error}</AlertDescription>
          </Alert>
        )}
         {isConfigError && (
             <p className="text-[9px] text-amber-700 dark:text-amber-500 text-center max-w-xs pt-0.5">Απαιτείται έγκυρο WEATHER_API_KEY.</p>
        )}


        <div className="flex items-center justify-end space-x-2 mt-0.5 w-full">
          {showSpinner ? (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          ) : (
            <IconComponentToday className="w-8 h-8 text-primary" />
          )}
          <div className="text-right">
            <p className="text-xl font-bold">{tempText}</p>
            <p className="text-xs text-muted-foreground whitespace-nowrap">{conditionText}</p>
          </div>
           {canExpand && (
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0" aria-label={isExpanded ? "Απόκρυψη πρόγνωσης" : "Εμφάνιση πρόγνωσης"}>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>
         {precipitationText && !showSpinner && !isConfigError && (
              <div className="flex items-center text-muted-foreground text-[10px] mt-0.5 self-end">
                <Droplets className="w-3 h-3 mr-1" />
                <span className="text-[10px]">{precipitationText}</span>
              </div>
            )}
      </div>

      {isExpanded && canExpand && !isConfigError && (
        <div 
          id="weekly-forecast-container" 
          className={cn(
            'bg-background/90 dark:bg-muted/50 rounded-lg border border-border/50 shadow-xl backdrop-blur-sm z-50',
            {
              // Desktop positioning: absolute, to the left of the summary
              'absolute top-2 right-full mr-4 w-[400px] p-2 animate-fadeIn': !isMobile,
              // Mobile positioning: relative, below the summary
              'mt-2 p-2': isMobile,
            }
          )}
        >
          <div className="flex flex-nowrap space-x-1.5 pb-1 overflow-x-auto">
            {forecastData.map((item, index) => {
              const ItemIconComponent = getWeatherIconFromCode(item?.iconCode);
              const itemSafeCondition = item?.condition || 'N/A';
              const itemSafePrecipitation = item?.precipitation;
              return (
                <Card key={index} className="shadow-sm text-center bg-card/80 w-[70px] flex-shrink-0">
                  <CardHeader className="p-1">
                    <CardTitle className="text-xs font-medium truncate">{item?.day || '-'}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center p-1 space-y-0.5 min-h-[90px]">
                      <ItemIconComponent className="w-6 h-6 text-primary" />
                    <p className="text-sm font-semibold">{item?.temp || 'N/A'}</p>
                    <div className="flex items-center text-[10px] text-muted-foreground justify-center h-6">
                        <span className="leading-normal text-center">{itemSafeCondition}</span>
                    </div>
                    {itemSafePrecipitation && (
                        <div className="flex items-center text-[10px] text-muted-foreground justify-center mt-0.5 h-5">
                            <Droplets className="w-3 h-3 mr-0.5 flex-shrink-0" />
                            <span className="leading-normal text-center">{itemSafePrecipitation}</span>
                        </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="w-full text-[10px] h-7 mt-1"
            aria-controls="weekly-forecast-container"
          >
            <ChevronUp className="w-2.5 h-2.5 mr-1" />
            Απόκρυψη πρόγνωσης
          </Button>
        </div>
      )}
    </div>
  );
}
