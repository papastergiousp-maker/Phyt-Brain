
'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAgroStore, type QueryRecord } from '@/lib/store';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the main component with a loading skeleton
const AgroAIGreek = dynamic(() => import('@/components/ai/AgroAIGreek').then(mod => mod.AgroAIGreek), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 space-y-4">
        <Skeleton className="h-16 w-3/4 ml-auto rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
      <div className="p-4 border-t">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  ),
});

export default function DashboardPage() {
  const { 
    selectedQueryFromHistory, 
    setSelectedQueryFromHistory
  } = useAgroStore();
  
  const handleProcessedHistoricalQuery = useCallback(() => {
    setSelectedQueryFromHistory(null);
  }, [setSelectedQueryFromHistory]);

  return (
      <AgroAIGreek 
        initialSelectedQuery={selectedQueryFromHistory} 
        onProcessedHistoricalQuery={handleProcessedHistoricalQuery} 
      />
  );
}
