
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { getSmartCropPlanAction } from '@/actions/ai-actions';
import type { SmartCropPlanOutput } from '@/ai/flows/smart-crop-planning-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LocateFixed, AlertTriangle, Leaf, Droplets, Thermometer, FlaskConical, Wheat, Siren, Expand, Shrink } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const MapSelector = dynamic(() => import('@/components/smart-crop-planning/MapSelector'), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full rounded-md" />,
});

const ResultCard = ({ title, icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => {
  const Icon = icon;
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center">
          <Icon className="mr-3 h-6 w-6 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
};

export default function SmartCropPlanningPage() {
  const [position, setPosition] = useState({ lat: 38.29, lng: 21.78 }); // Default to a central Greek location
  const [analysisResult, setAnalysisResult] = useState<SmartCropPlanOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isMapMaximized, setIsMapMaximized] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handlePositionChange = useCallback((newPos: { lat: number; lng: number }) => {
    setPosition(newPos);
  }, []);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handlePositionChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError("Δεν ήταν δυνατή η λήψη της τοποθεσίας σας. Παρακαλώ ελέγξτε τις άδειες του περιηγητή.");
        }
      );
    } else {
      setError("Η γεωγραφική τοποθεσία δεν υποστηρίζεται από αυτόν τον περιηγητή.");
    }
  };

  const handleAnalyzeClick = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    const result = await getSmartCropPlanAction({
      latitude: position.lat,
      longitude: position.lng,
    });

    if ('error' in result) {
      setError(result.error);
    } else {
      setAnalysisResult(result);
    }

    setIsLoading(false);
  };
  
  const mapComponent = useMemo(() => {
    if (!isClient) return <Skeleton className="h-[600px] w-full rounded-md" />;
    return <MapSelector onPositionChange={handlePositionChange} initialPosition={position} height={isMapMaximized ? 'calc(100vh - 200px)' : '600px'} />
  }, [isClient, handlePositionChange, position, isMapMaximized])

  return (
    <div className="container mx-auto p-4 py-6 md:p-8 md:py-10">
      <PageHeader
        title="Έξυπνος Σχεδιασμός Καλλιέργειας"
        description="Επιλέξτε ένα σημείο στον χάρτη για να λάβετε μια λεπτομερή γεωπονική ανάλυση και προτάσεις καλλιεργειών από τον Phyt."
      >
      <Button asChild variant="outline">
          <Link href="/dashboard">Επιστροφή στο AgroAssist</Link>
      </Button>
      </PageHeader>
      
      <div className={cn("grid grid-cols-1 gap-6", isMapMaximized ? "md:grid-cols-1" : "md:grid-cols-2")}>
        <div className={cn(isMapMaximized ? "md:col-span-1" : "md:col-span-1", "space-y-4")}>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                      <CardTitle>Επιλογή Τοποθεσίας</CardTitle>
                      <CardDescription>Κάντε κλικ στον χάρτη για επιλογή.</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsMapMaximized(!isMapMaximized)}>
                      {isMapMaximized ? <Shrink className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
                  </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                  <div className="relative">
                      {mapComponent}
                      <Button onClick={handleGetCurrentLocation} variant="secondary" size="icon" className="absolute top-2 right-2 z-[401]">
                          <LocateFixed className="h-5 w-5" />
                      </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                      <Button onClick={handleAnalyzeClick} disabled={isLoading} className="w-full">
                          {isLoading ? (
                              <Loader2 className="mr-2 animate-spin" />
                          ) : (
                              <Wheat className="mr-2" />
                          )}
                          Ανάλυση Περιοχής
                      </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                      Lat: {position.lat.toFixed(4)}, Lng: {position.lng.toFixed(4)}
                  </p>
              </CardContent>
           </Card>
        </div>
        
        <div className={cn("md:col-span-1 space-y-6", isMapMaximized && "hidden")}>
          
          {isLoading && (
            <div className="space-y-4">
               <Skeleton className="h-32 w-full" />
               <Skeleton className="h-32 w-full" />
               <Skeleton className="h-32 w-full" />
            </div>
          )}
          {error && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <AlertTriangle className="mr-2" />
                  Σφάλμα Ανάλυσης
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{error}</p>
              </CardContent>
            </Card>
          )}
          {analysisResult && (
             <div className="space-y-6 animate-fadeIn">
               <Card className="border-primary/20">
                  <CardHeader>
                      <CardTitle>{analysisResult.locationName}</CardTitle>
                      <CardDescription>
                          <pre className="text-sm whitespace-pre-wrap font-sans">{analysisResult.overallSummary}</pre>
                      </CardDescription>
                  </CardHeader>
               </Card>
               
               <ResultCard title="Ανάλυση Εδάφους" icon={Leaf}>
                  <p><strong>Τύπος:</strong> {analysisResult.soilAnalysis.type}</p>
                  <p><strong>pH:</strong> {analysisResult.soilAnalysis.ph}</p>
                  <p><strong>Υφή:</strong> {analysisResult.soilAnalysis.texture}</p>
                  <p><strong>Αποστράγγιση:</strong> {analysisResult.soilAnalysis.drainage}</p>
               </ResultCard>

               <ResultCard title="Ανάλυση Νερού" icon={Droplets}>
                  <p><strong>Διαθεσιμότητα:</strong> {analysisResult.waterAnalysis.availability}</p>
                  <p><strong>Ποιότητα:</strong> {analysisResult.waterAnalysis.quality}</p>
                  <p><strong>pH:</strong> {analysisResult.waterAnalysis.ph}</p>
                  <p><strong>Σκληρότητα:</strong> {analysisResult.waterAnalysis.hardness}</p>
               </ResultCard>

               <ResultCard title="Ανάλυση Κλίματος" icon={Thermometer}>
                  <p><strong>Μέσες Θερμοκρασίες:</strong> {analysisResult.climateAnalysis.averageTemperatures}</p>
                  <p><strong>Κίνδυνος Παγετού:</strong> {analysisResult.climateAnalysis.frostRisk}</p>
                  <p><strong>Καλλιεργητική Περίοδος:</strong> {analysisResult.climateAnalysis.growingSeason}</p>
                  <p><strong>Ετήσια Βροχόπτωση:</strong> {analysisResult.climateAnalysis.annualRainfall}</p>
               </ResultCard>

               <ResultCard title="Ανάλυση Θρεπτικών" icon={FlaskConical}>
                  <p><strong>Γενική Κατάσταση:</strong> {analysisResult.nutrientAnalysis.general}</p>
                  <p><strong>Πιθανές Ελλείψεις:</strong> {analysisResult.nutrientAnalysis.potentialDeficiencies}</p>
                  <p><strong>Συστάσεις:</strong> {analysisResult.nutrientAnalysis.recommendations}</p>
               </ResultCard>

               {analysisResult.cropRecommendations.length > 0 && (
                   <ResultCard title="Προτάσεις Καλλιεργειών" icon={Wheat}>
                      <ul className="list-disc list-inside space-y-1">
                          {analysisResult.cropRecommendations.map(crop => (
                              <li key={crop.crop}>
                                  <strong>{crop.crop}</strong> ({crop.suitability}) - {crop.reason}
                              </li>
                          ))}
                      </ul>
                   </ResultCard>
               )}

               {analysisResult.pestAndDiseaseRisk.length > 0 && (
                   <ResultCard title="Κίνδυνοι Ασθενειών/Εχθρών" icon={Siren}>
                       <ul className="list-disc list-inside space-y-1">
                          {analysisResult.pestAndDiseaseRisk.map(pest => (
                              <li key={pest.name}>
                                  <strong>{pest.name}</strong> (Κίνδυνος: {pest.riskLevel}, Προσβάλλει: {pest.relevantCrops}) - {pest.details}
                              </li>
                          ))}
                      </ul>
                   </ResultCard>
               )}
             </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
