// src/components/agroassist/CameraDialog.tsx
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
import { getOrderExtraction } from '@/actions/ai-actions';
import { catalogDataString } from '@/ai/data/catalog-data';
import { Camera, Loader2, Upload, X } from 'lucide-react';
import type { ExtractOrderFromImageOutput } from '@/ai/flows/extract-order-from-image-types';

interface CameraDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScanComplete: (data: ExtractOrderFromImageOutput) => void;
}

const resizeImage = (dataUri: string, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Image resizing can only be done on the client.'));
    }
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;

      if (width <= maxWidth && height <= maxHeight) {
        resolve(dataUri);
        return;
      }

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context for resizing.'));
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = (err) => {
      reject(err instanceof ErrorEvent ? err.error : new Error('Image could not be loaded for resizing.'));
    };
    img.src = dataUri;
  });
};


export function CameraDialog({ isOpen, onOpenChange, onScanComplete }: CameraDialogProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      if (!isOpen) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };
    
    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isOpen, toast]);

  const handleCaptureAndProcess = async (dataUri: string) => {
    setIsProcessing(true);
    toast({ title: 'Επεξεργασία Εικόνας...', description: 'Αλλαγή μεγέθους εικόνας για ανάλυση...' });
    
    try {
      const resizedDataUri = await resizeImage(dataUri, 1024, 1024);
      toast({ title: 'Επεξεργασία Εικόνας...', description: 'Ο Phyt αναλύει την παραγγελία.' });

      const result = await getOrderExtraction({
        imageDataUri: resizedDataUri,
        catalogData: catalogDataString,
      });
      
      if ('error' in result) {
        toast({
          title: 'Η Ανάλυση του Phyt Απέτυχε',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        onScanComplete(result);
      }
    } catch (error) {
      console.error("Error resizing or processing image:", error);
      toast({
        title: 'Αποτυχία Επεξεργασίας Εικόνας',
        description: 'Δεν ήταν δυνατή η επεξεργασία της εικόνας. Παρακαλώ δοκιμάστε μια διαφορετική.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCaptureClick = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        handleCaptureAndProcess(dataUri);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleCaptureAndProcess(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
     if (event.target) {
        event.target.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Σάρωση Παραγγελίας από Εικόνα</DialogTitle>
          <DialogDescription>
            Στρέψτε την κάμερά σας στη λίστα παραγγελίας ή ανεβάστε μια εικόνα. Ο Phyt θα προσπαθήσει να εξάγει τα προϊόντα και τις ποσότητες.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="relative aspect-video w-full bg-black rounded-md overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-contain" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p>Ο Phyt αναλύει την παραγγελία...</p>
              </div>
            )}
          </div>
          {hasCameraPermission === false && (
            <Alert variant="destructive">
              <AlertTitle>Απαιτείται Πρόσβαση στην Κάμερα</AlertTitle>
              <AlertDescription>
                Παρακαλώ επιτρέψτε την πρόσβαση στην κάμερα για να χρησιμοποιήσετε αυτή τη λειτουργία. Μπορείτε ακόμα να ανεβάσετε ένα αρχείο.
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
            <Upload className="mr-2 h-4 w-4" /> Ανέβασμα Αρχείου
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <Button type="button" onClick={handleCaptureClick} disabled={!hasCameraPermission || isProcessing}>
            <Camera className="mr-2 h-4 w-4" /> Λήψη & Ανάλυση
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
