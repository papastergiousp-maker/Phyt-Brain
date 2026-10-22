

'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAgroStore, type QueryRecord } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { el } from 'date-fns/locale';
import { Bot, Image as ImageIcon, Trash2, Repeat, Copy, ZoomIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RecentSearchesModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function RecentSearchesModal({ isOpen, setIsOpen }: RecentSearchesModalProps) {
  const { queryHistory, deleteQueryFromHistory, setSelectedQueryFromHistory, user } = useAgroStore();
  const { toast } = useToast();
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const groupedQueries = useMemo(() => {
    if (!user) return [];
    
    const userHistory = queryHistory.filter(q => q.userId === user.id);

    return userHistory.reduce((acc: { [key: string]: QueryRecord[] }, query) => {
      const date = query.timestamp?.toDate ? query.timestamp.toDate() : new Date(0);
      let key = '';
      if (isToday(date)) {
        key = 'Σήμερα';
      } else if (isYesterday(date)) {
        key = 'Χθες';
      } else {
        key = format(date, 'd MMMM yyyy', { locale: el });
      }
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(query);
      return acc;
    }, {});
  }, [queryHistory, user]);

  const handleLoadQuery = (query: QueryRecord) => {
    setSelectedQueryFromHistory(query);
    setIsOpen(false);
  };
  
  const handleDeleteQuery = useCallback(async (queryId: string) => {
    await deleteQueryFromHistory(queryId);
    toast({ title: "Η αναζήτηση διαγράφηκε" });
  }, [deleteQueryFromHistory, toast]);
  
  const handleCopyText = (text: string) => {
      navigator.clipboard.writeText(text);
      toast({ title: "Το κείμενο αντιγράφηκε!" });
  }

  const getResponseText = (query: QueryRecord): string => {
    if ('error' in query.response) {
      return query.response.error;
    }
    if (query.type === 'text') {
      return query.response.answer;
    }
    if (query.type === 'image') {
      return `${query.response.productName}: ${query.response.analysis}`;
    }
    return '';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Πρόσφατες Αναζητήσεις</DialogTitle>
            <DialogDescription>
              Δείτε τις προηγούμενες αναζητήσεις σας. Θα συγχρονιστούν σε όλες τις συσκευές σας.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 py-4">
              {Object.keys(groupedQueries).length > 0 ? (
                Object.entries(groupedQueries).map(([date, queries]) => (
                  <div key={date}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-2">{date}</h3>
                    <div className="space-y-2">
                      {queries.map(query => (
                        <div key={query.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <div className="flex-shrink-0">
                            {query.type === 'image' && query.thumbnailDataUri ? (
                               <button onClick={() => setZoomedImage(query.imageDataUri || null)} className="relative w-14 h-14 rounded-md bg-muted flex items-center justify-center overflow-hidden group">
                                  <Image src={query.thumbnailDataUri} alt="Thumbnail" width={56} height={56} className="object-cover w-full h-full" />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <ZoomIn className="w-6 h-6 text-white" />
                                  </div>
                               </button>
                            ) : (
                              <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center">
                                <Bot className="w-7 h-7 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-2">{query.question || 'Ανάλυση Εικόνας'}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{getResponseText(query)}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleLoadQuery(query)} title="Επανάληψη Αναζήτησης">
                              <Repeat className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyText(getResponseText(query))} title="Αντιγραφή Κειμένου">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90" title="Διαγραφή Αναζήτησης">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Αυτή η ενέργεια δεν μπορεί να αναιρεθεί. Θέλετε σίγουρα να διαγράψετε αυτή την αναζήτηση;
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Ακύρωση</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteQuery(query.id)}>Διαγραφή</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-10">Δεν υπάρχουν πρόσφατες αναζητήσεις.</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!zoomedImage} onOpenChange={(open) => !open && setZoomedImage(null)}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-2">
          {zoomedImage && <Image src={zoomedImage} alt="Zoomed search" layout="fill" objectFit="contain" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
