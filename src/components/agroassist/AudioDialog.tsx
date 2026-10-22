// src/components/agroassist/AudioDialog.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getOrderExtractionFromAudio } from '@/actions/ai-actions';
import { catalogDataString } from '@/ai/data/catalog-data';
import { Mic, StopCircle, Loader2, Square, Waves } from 'lucide-react';
import type { ExtractOrderFromAudioOutput } from '@/ai/flows/extract-order-from-audio-types';

interface AudioDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScanComplete: (data: ExtractOrderFromAudioOutput, audioDataUri: string) => void;
}

export function AudioDialog({ isOpen, onOpenChange, onScanComplete }: AudioDialogProps) {
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && hasMicPermission === null) {
      const getMicPermission = async () => {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          setHasMicPermission(true);
        } catch (error) {
          console.error('Error accessing microphone:', error);
          setHasMicPermission(false);
          toast({
            variant: 'destructive',
            title: 'Microphone Access Denied',
            description: 'Please enable microphone permissions in your browser settings.',
          });
        }
      };
      getMicPermission();
    }
  }, [isOpen, hasMicPermission, toast]);

  const startRecording = async () => {
    if (isRecording || !hasMicPermission) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const audioDataUri = reader.result as string;
          await handleProcessAudio(audioDataUri);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
        console.error("Failed to start recording:", error);
        toast({ title: 'Recording Error', description: 'Could not start recording.', variant: 'destructive'});
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true); // Now processing starts
    }
  };

  const handleProcessAudio = async (audioDataUri: string) => {
    toast({ title: 'Επεξεργασία Ήχου...', description: 'Ο Phyt απομαγνητοφωνεί και αναλύει την παραγγελία σας.' });
    
    try {
      const result = await getOrderExtractionFromAudio({
        audioDataUri: audioDataUri,
        catalogData: catalogDataString,
      });
      
      if ('error' in result) {
        toast({
          title: 'Η Ανάλυση του Phyt Απέτυχε',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        onScanComplete(result, audioDataUri);
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      toast({
        title: 'Αποτυχία Επεξεργασίας Ήχου',
        description: 'Δεν ήταν δυνατή η επεξεργασία του ήχου. Παρακαλώ δοκιμάστε ξανά.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ηχογράφηση Παραγγελίας</DialogTitle>
          <DialogDescription>
            Πατήστε το κουμπί ηχογράφησης και πείτε την παραγγελία σας. Ο Phyt θα την απομαγνητοφωνήσει και θα προσθέσει τα προϊόντα στη λίστα σας.
          </DialogDescription>
        </DialogHeader>
        <div className="py-8 flex flex-col items-center justify-center space-y-4">
          {isProcessing ? (
             <div className="flex flex-col items-center text-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Ο Phyt αναλύει τον ήχο...</p>
             </div>
          ) : isRecording ? (
            <div className="flex flex-col items-center text-center">
                <Waves className="h-16 w-16 text-red-500 animate-pulse mb-4" />
                <p className="text-muted-foreground">Ηχογράφηση... Πατήστε stop όταν τελειώσετε.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
                <Mic className="h-16 w-16 text-primary mb-4" />
                <p className="text-muted-foreground">Έτοιμος για ηχογράφηση.</p>
            </div>
          )}

          {hasMicPermission === false && (
            <Alert variant="destructive">
              <AlertTitle>Απαιτείται Πρόσβαση στο Μικρόφωνο</AlertTitle>
              <AlertDescription>
                Παρακαλώ επιτρέψτε την πρόσβαση στο μικρόφωνο για να χρησιμοποιήσετε αυτή τη λειτουργία.
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          {isRecording ? (
             <Button type="button" variant="destructive" onClick={stopRecording} disabled={isProcessing}>
                <StopCircle className="mr-2 h-4 w-4" /> Stop & Ανάλυση
             </Button>
          ) : (
             <Button type="button" onClick={startRecording} disabled={!hasMicPermission || isProcessing}>
                <Mic className="mr-2 h-4 w-4" /> Έναρξη Ηχογράφησης
             </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
