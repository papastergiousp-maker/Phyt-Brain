

'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Camera, Upload, ScanSearch, FileWarning, X, Share2, MessageSquareQuote, Briefcase, Inbox, ChevronsUpDown, Check, ListOrdered, ImageUp, Map, Bot, Copy, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAgroGreekAnswer, getProductExamination } from '@/actions/ai-actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  useAgroStore, 
  type QueryRecord,
} from '@/lib/store';
import type { AskAgroGreekOutput } from '@/ai/flows/ask-agro-greek-types';
import type { ExamineProductOutput } from '@/ai/flows/examine-product-types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ToastAction } from '@/components/ui/toast';


interface AgroAIGreekProps {
  initialSelectedQuery?: QueryRecord | null;
  onProcessedHistoricalQuery?: () => void;
}

type ConversationTurn = {
  role: 'user' | 'model';
  content: string;
};

// Interface for storing and displaying past, completed turns
interface PastTurn {
    id: string;
    question: string | null;
    imageDataUri?: string | null;
    response: AskAgroGreekOutput | ExamineProductOutput | { error: string };
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
            resolve(canvas.toDataURL('image/jpeg', 0.85)); // 85% quality
        };
        img.onerror = (err) => {
            reject(err instanceof ErrorEvent ? err.error : new Error('Image could not be loaded for resizing.'));
        };
        img.src = dataUri;
    });
};

const createThumbnail = (dataUri: string, size: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            return reject(new Error('Thumbnail creation can only be done on the client.'));
        }
        const img = new window.Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context for thumbnail.'));
            }

            const sourceX = img.width > img.height ? (img.width - img.height) / 2 : 0;
            const sourceY = img.height > img.width ? (img.height - img.width) / 2 : 0;
            const sourceSize = Math.min(img.width, img.height);
            
            ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
            resolve(canvas.toDataURL('image/jpeg', 0.7)); // Lower quality for thumbnail
        };
        img.onerror = (err) => {
            reject(err instanceof ErrorEvent ? err.error : new Error('Image could not be loaded for thumbnail.'));
        };
        img.src = dataUri;
    });
};


export function AgroAIGreek({ initialSelectedQuery, onProcessedHistoricalQuery }: AgroAIGreekProps) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [zoomedImageUri, setZoomedImageUri] = useState<string | null>(null);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  // State for interactive zoom
  const imageRef = useRef<HTMLImageElement>(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const [lastTransform, setLastTransform] = useState({ scale: 1, x: 0, y: 0 });


  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [displayedQuestion, setDisplayedQuestion] = useState<string | null>(null);
  
  // States for text-based AI response
  const [aiResponse, setAiResponse] = useState<AskAgroGreekOutput | null>(null);
  const [displayedAnswer, setDisplayedAnswer] = useState('');
  const [isStreamingText, setIsStreamingText] = useState(false);
  const textStreamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // States for image-based AI analysis
  const [productAnalysis, setProductAnalysis] = useState<ExamineProductOutput | null>(null);
  const [displayedProductName, setDisplayedProductName] = useState('');
  const [displayedAnalysisText, setDisplayedAnalysisText] = useState('');
  const [displayedAdviceText, setDisplayedAdviceText] = useState('');
  const [isStreamingAnalysis, setIsStreamingAnalysis] = useState(false);
  const analysisStreamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // States for past turns
  const [pastTurns, setPastTurns] = useState<PastTurn[]>([]);
  const [imageForLastResponse, setImageForLastResponse] = useState<string | null>(null);


  // General image states
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Location state
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { 
    isAuthenticated,
    user,
    addQueryToHistory,
    hasReachedQueryLimit,
    sendAnalysisToAgronomist,
    staffMembers, 
    associatedAgronomistId,
    setAssociatedAgronomist
  } = useAgroStore();
  

  const [currentLimitReached, setCurrentLimitReached] = useState(false); 
  const [isClient, setIsClient] = useState(false);

  const [isAgronomistSelectorOpen, setIsAgronomistSelectorOpen] = useState(false);
  const [isSendToAgronomistDialogOpen, setIsSendToAgronomistDialogOpen] = useState(false);
  const [selectedAgronomistId, setSelectedAgronomistId] = useState<string | null>(null);
  const [agronomistPopoverOpen, setAgronomistPopoverOpen] = useState(false);
  const [agronomistSearchValue, setAgronomistSearchValue] = useState("");

  const availableAgronomists = useMemo(() => {
    return staffMembers
      .filter(member => member.rank === 'Management' || member.rank === 'Staff')
      .map(staff => {
        return {
          ...staff,
        };
      });
  }, [staffMembers]);

  const handleOpenSendToAgronomistDialog = () => {
      if (availableAgronomists.length === 0) {
          toast({
              title: 'Δεν Βρέθηκαν Γεωπόνοι',
              description: 'Δεν υπάρχουν διαθέσιμοι γεωπόνοι για αποστολή αιτήματος.',
              variant: 'destructive',
          });
          return;
      }
      if (associatedAgronomistId && availableAgronomists.some(a => a.id === associatedAgronomistId)) {
        setSelectedAgronomistId(associatedAgronomistId);
      } else {
        setSelectedAgronomistId(null);
      }
      setIsSendToAgronomistDialogOpen(true);
  };
  
  const handleOpenAgronomistConnectionDialog = () => {
    if (availableAgronomists.length === 0) {
        toast({
            title: 'Δεν Βρέθηκαν Γεωπόνοι',
            description: 'Δεν υπάρχουν διαθέσιμοι γεωπόνοι για σύνδεση.',
            variant: 'destructive',
        });
        return;
    }
    setIsAgronomistSelectorOpen(true);
  };

  const handleConfirmAgronomistConnection = () => {
    if (!selectedAgronomistId || !user?.id) {
        toast({
            title: 'Επιλέξτε Γεωπόνο',
            description: 'Πρέπει να επιλέξετε έναν γεωπόνο από τη λίστα.',
            variant: 'destructive',
        });
        return;
    }

    const agronomist = availableAgronomists.find(a => a.id === selectedAgronomistId);
    setAssociatedAgronomist(selectedAgronomistId, user.id);
    toast({
        title: 'Επιτυχής Σύνδεση!',
        description: `Συνδεθήκατε με τον γεωπόνο ${agronomist?.name}.`,
    });
    setIsAgronomistSelectorOpen(false);
    setSelectedAgronomistId(null);
    setAgronomistSearchValue("");
  };


  const handleConfirmSendToAgronomist = () => {
    if (!productAnalysis || !imageForLastResponse) return; // Check for imageForLastResponse
    if (!selectedAgronomistId) {
        toast({
            title: 'Επιλέξτε Γεωπόνο',
            description: 'Πρέπει να επιλέξετε έναν γεωπόνο από τη λίστα.',
            variant: 'destructive',
        });
        return;
    }
    const selectedAgronomist = availableAgronomists.find(a => a.id === selectedAgronomistId);
    if (!selectedAgronomist) return;

    const fullAnalysisTextForSending = `Προϊόν: ${productAnalysis.productName}\n\nΔιάγνωση: ${(productAnalysis.identifiedProblems || []).join(', ')}\n\nΑνάλυση: ${productAnalysis.analysis}\n\nΣυμβουλές: ${productAnalysis.advice}`;
    const success = sendAnalysisToAgronomist(
      fullAnalysisTextForSending,
      displayedQuestion || '',
      { id: selectedAgronomist.id, name: selectedAgronomist.name },
      imageForLastResponse // Pass the image URI
    );

    if (success) {
      toast({
        title: 'Το αίτημα στάλθηκε!',
        description: `Η ανάλυσή σας έχει σταλεί στον γεωπόνο ${selectedAgronomist.name} για έλεγχο.`,
      });
    } else {
      toast({
        title: 'Αποτυχία Αποστολής',
        description: 'Δεν ήταν δυνατή η αποστολή. Είστε συνδεδεμένοι;',
        variant: 'destructive',
      });
    }
    setIsSendToAgronomistDialogOpen(false);
    setSelectedAgronomistId(null);
    setAgronomistSearchValue("");
  };

  const handleImageZoom = (imageUri: string | null | undefined) => {
    if (imageUri) {
      setZoomedImageUri(imageUri);
      setIsZoomModalOpen(true);
    }
  };
  
  const handleZoomOpenChange = (open: boolean) => {
    setIsZoomModalOpen(open);
    if (!open) {
      // Reset zoom state when closing. A small delay helps the animation finish.
      setTimeout(() => setTransform({ scale: 1, x: 0, y: 0 }), 150);
    }
  };
  
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!imageRef.current) return;
    
    const { deltaY, clientX, clientY } = e;
    const scaleAmount = -deltaY * 0.005; // Adjust sensitivity
    const rect = imageRef.current.getBoundingClientRect();

    setTransform(prev => {
        const newScale = Math.min(Math.max(1, prev.scale + scaleAmount), 10); // Clamp scale

        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        const imageX = (mouseX - prev.x) / prev.scale;
        const imageY = (mouseY - prev.y) / prev.scale;

        const newX = mouseX - imageX * newScale;
        const newY = mouseY - imageY * newScale;

        if (newScale <= 1) {
            return { scale: 1, x: 0, y: 0 };
        }
        
        return { scale: newScale, x: newX, y: newY };
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (transform.scale <= 1) return;
    e.preventDefault();
    e.stopPropagation();
    setIsPanning(true);
    setPanStart({
        x: e.clientX - transform.x,
        y: e.clientY - transform.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    e.preventDefault();
    const newX = e.clientX - panStart.x;
    const newY = e.clientY - panStart.y;
    setTransform(prev => ({ ...prev, x: newX, y: newY }));
  };

  const handleMouseUpOrLeave = () => {
    if(isPanning) {
        setIsPanning(false);
    }
  };
  
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setLastTransform(transform);
    if (e.touches.length === 2) {
      setIsPanning(false);
      const [touch1, touch2] = e.touches;
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      setInitialPinchDistance(distance);
    } else if (e.touches.length === 1) {
      if (transform.scale > 1) {
          setIsPanning(true);
          const touch = e.touches[0];
          setPanStart({
            x: touch.clientX - transform.x,
            y: touch.clientY - transform.y,
          });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.touches.length === 2 && initialPinchDistance > 0 && imageRef.current) {
      // Pinch to zoom
      const [touch1, touch2] = e.touches;
      const newDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const scaleMultiplier = newDistance / initialPinchDistance;
      const newScale = Math.min(Math.max(1, lastTransform.scale * scaleMultiplier), 10);

      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;
      const rect = imageRef.current.getBoundingClientRect();
      const imageX = (midX - rect.left - lastTransform.x) / lastTransform.scale;
      const imageY = (midY - rect.top - lastTransform.y) / lastTransform.scale;
      const newX = midX - rect.left - imageX * newScale;
      const newY = midY - rect.top - imageY * newScale;

      setTransform({ scale: newScale, x: newX, y: newY });

    } else if (e.touches.length === 1 && isPanning) {
      // Drag to pan
      const touch = e.touches[0];
      const newX = touch.clientX - panStart.x;
      const newY = touch.clientY - panStart.y;
      setTransform(prev => ({ ...prev, x: newX, y: newY }));
    }
  };

  const handleTouchEnd = () => {
    setInitialPinchDistance(0);
    setIsPanning(false);
    if(transform.scale <= 1){
        setTransform({ scale: 1, x: 0, y: 0 });
    }
  };


  useEffect(() => {
    setIsClient(true);
  }, []);

  // Geolocation effect to get user's coordinates
  useEffect(() => {
    if (isClient && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
          let userMessage = "Could not get location. Weather-related AI features will be unavailable.";
          if (error.code === error.PERMISSION_DENIED) {
            userMessage = "Location permission denied. Weather-related AI features are disabled.";
          }
          setLocationError(userMessage);
          toast({
            title: 'Geolocation Error',
            description: userMessage,
            variant: 'default',
            duration: 7000,
          });
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 1000 * 60 * 30, // 30 minutes
        }
      );
    } else if (isClient) {
      setLocationError("Geolocation is not supported by this browser. Weather features will be disabled.");
    }
  }, [isClient, toast]);

 useEffect(() => {
    const action = searchParams.get('action');
    if (action) {
      if (action === 'upload' && fileInputRef.current) {
        fileInputRef.current.click();
      } else if (action === 'camera') {
        setShowCamera(true);
      }
      // Clean up the URL by removing the action query parameter
      router.replace(pathname, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router, pathname]);

 useEffect(() => {
    if (isClient) {
      setCurrentLimitReached(hasReachedQueryLimit());
    }
 }, [isClient, hasReachedQueryLimit, user, useAgroStore.getState().queryCount]);
  
  const clearAllOutputs = () => {
      setAiResponse(null);
      setDisplayedAnswer('');
      if (textStreamIntervalRef.current) clearInterval(textStreamIntervalRef.current);
      setIsStreamingText(false);

      setProductAnalysis(null);
      setDisplayedProductName('');
      setDisplayedAnalysisText('');
      setDisplayedAdviceText('');
      if (analysisStreamIntervalRef.current) clearInterval(analysisStreamIntervalRef.current);
      setIsStreamingAnalysis(false);
  }
  
  // This effect handles restoring state from history
  useEffect(() => {
    if (initialSelectedQuery) {
      setQuestion(initialSelectedQuery.question || '');
      setImageDataUri(initialSelectedQuery.imageDataUri || null);
      clearAllOutputs();
      setPastTurns([]); // Clear past turns when loading from history
      setConversationHistory([]); // Reset conversation when loading from history
      setDisplayedQuestion(initialSelectedQuery.question || null);
      setImageForLastResponse(initialSelectedQuery.imageDataUri || null); // Restore the image for future actions

      if ('error' in initialSelectedQuery.response) {
        toast({
          title: initialSelectedQuery.type === 'image' ? 'Προβολή Ιστορικού (Σφάλμα Εξέτασης)' : 'Προβολή Ιστορικού (Σφάλμα Συμβουλής)',
          description: initialSelectedQuery.response.error,
          variant: 'destructive',
          action: (
              <ToastAction altText="Αντιγραφή" onClick={() => handleCopyToClipboard(initialSelectedQuery.response.error)}>
                  <Copy className="h-4 w-4" />
              </ToastAction>
          ),
        });
      } else {
        const response = initialSelectedQuery.response as AskAgroGreekOutput | ExamineProductOutput;

        if (initialSelectedQuery.type === 'image' && 'productName' in response) {
          setProductAnalysis(response as ExamineProductOutput); // This triggers the analysis streaming effect
        } else if (initialSelectedQuery.type === 'text' && 'answer' in response) {
          const agroResponse = response as AskAgroGreekOutput;
          setAiResponse(agroResponse); // This triggers the text streaming effect
        }
      }
      
      if (onProcessedHistoricalQuery) {
        onProcessedHistoricalQuery();
      }
    }
  }, [initialSelectedQuery, toast, onProcessedHistoricalQuery]);

  // Effect for streaming TEXT response
  useEffect(() => {
    if (textStreamIntervalRef.current) {
      clearInterval(textStreamIntervalRef.current);
    }

    if (aiResponse?.answer) {
      setIsStreamingText(true);
      setDisplayedAnswer('');
      const tokens = aiResponse.answer.match(/\S+\s*|\n/g) || []; // Match words with trailing space, or newlines
      let i = 0;
      textStreamIntervalRef.current = setInterval(() => {
        if (i < tokens.length) {
          setDisplayedAnswer(prev => prev + tokens[i]);
          i++;
        } else {
          if (textStreamIntervalRef.current) clearInterval(textStreamIntervalRef.current);
          textStreamIntervalRef.current = null;
          setIsStreamingText(false);
        }
      }, 30); // A reasonable speed for token-by-token
    }

    return () => {
      if (textStreamIntervalRef.current) {
        clearInterval(textStreamIntervalRef.current);
      }
    };
  }, [aiResponse]);

  // Effect for streaming ANALYSIS response
  useEffect(() => {
    if (analysisStreamIntervalRef.current) {
      clearInterval(analysisStreamIntervalRef.current);
    }

    if (productAnalysis) {
      setIsStreamingAnalysis(true);
      setDisplayedProductName(productAnalysis.productName);
      setDisplayedAnalysisText('');
      setDisplayedAdviceText('');

      const analysisTokens = productAnalysis.analysis.match(/\S+\s*|\n/g) || [];
      const adviceTokens = productAnalysis.advice.match(/\S+\s*|\n/g) || [];
      let analysisIndex = 0;
      let adviceIndex = 0;
      let phase: 'analysis' | 'advice' = 'analysis';

      analysisStreamIntervalRef.current = setInterval(() => {
        if (phase === 'analysis') {
            if (analysisIndex < analysisTokens.length) {
                setDisplayedAnalysisText(prev => prev + analysisTokens[analysisIndex]);
                analysisIndex++;
            } else {
                phase = 'advice';
            }
        } else if (phase === 'advice') {
            if (adviceIndex < adviceTokens.length) {
                setDisplayedAdviceText(prev => prev + adviceTokens[adviceIndex]);
                adviceIndex++;
            } else {
                if (analysisStreamIntervalRef.current) clearInterval(analysisStreamIntervalRef.current);
                analysisStreamIntervalRef.current = null;
                setIsStreamingAnalysis(false);
            }
        }
      }, 30); // A reasonable speed for token-by-token
    }

    return () => {
        if (analysisStreamIntervalRef.current) clearInterval(analysisStreamIntervalRef.current);
    }
  }, [productAnalysis]);

  const stopCameraStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const performQueryCheck = useCallback(() => {
    if (hasReachedQueryLimit()) {
      toast({
          title: 'Ημερήσιο Όριο Ερωτήσεων',
          description: 'Έχετε φτάσει το ημερήσιο όριο των ερωτήσεών σας. Παρακαλώ ελέγξτε τα πακέτα τιμολόγησης ή δοκιμάστε ξανά αύριο.',
          variant: 'destructive',
      });
      setCurrentLimitReached(true);
      return true; // Indicates limit is reached
    }
    return false; // Indicates limit is NOT reached
  }, [hasReachedQueryLimit, toast]);

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast({ title: 'Αντιγράφηκε!', description: 'Το κείμενο αντιγράφηκε στο πρόχειρο.' });
    }).catch(err => {
      console.error('Could not copy text: ', err);
      toast({ title: 'Σφάλμα Αντιγραφής', description: 'Δεν ήταν δυνατή η αντιγραφή.', variant: 'destructive' });
    });
  };

  const startImageAnalysis = useCallback(async (dataUri: string, userText: string) => {
      if (performQueryCheck()) return;

      if (textStreamIntervalRef.current) clearInterval(textStreamIntervalRef.current);
      if (analysisStreamIntervalRef.current) clearInterval(analysisStreamIntervalRef.current);
      setIsStreamingText(false);
      setIsStreamingAnalysis(false);

      if (!isStreamingText && !isStreamingAnalysis && (aiResponse || productAnalysis)) {
          const previousResponse = aiResponse || productAnalysis;
          if (previousResponse && displayedQuestion) {
              const newPastTurn: PastTurn = {
                  id: new Date().toISOString() + Math.random(),
                  question: displayedQuestion,
                  imageDataUri: imageForLastResponse,
                  response: previousResponse,
              };
              setPastTurns(prev => [newPastTurn, ...prev]);
          }
      }

      clearAllOutputs();
      setIsLoading(true);
      setDisplayedQuestion(userText); // Display any text the user typed with the image
      const conversationHistoryString = conversationHistory.map(turn => `${turn.role}: ${turn.content}`).join('\n');
      
      try {
          const thumbnailDataUri = await createThumbnail(dataUri, 100);
          const result = await getProductExamination({ 
              imageDataUri: dataUri, 
              userContext: userText,
              conversationHistory: conversationHistoryString,
          });
          
          await addQueryToHistory({ 
              type: 'image' as const, 
              question: userText, 
              imageDataUri: dataUri, 
              thumbnailDataUri: thumbnailDataUri, 
              response: result 
          });

          if ('error' in result) {
              toast({ 
                title: 'Σφάλμα από τον Phyt', 
                description: result.error, 
                variant: 'destructive',
                action: (
                    <ToastAction altText="Αντιγραφή" onClick={() => handleCopyToClipboard(result.error)}>
                        <Copy className="h-4 w-4" />
                    </ToastAction>
                ),
              });
              setConversationHistory(prev => [...prev, {role: 'user', content: userText}, {role: 'model', content: `Σφάλμα: ${result.error}`}]);
          } else {
              setProductAnalysis(result);
              setImageForLastResponse(dataUri);
              toast({ title: 'Η Εξέταση Ολοκληρώθηκε!', description: 'Η ανάλυση του προϊόντος από τον Phyt είναι έτοιμη.' });
              setConversationHistory(prev => [...prev, {role: 'user', content: userText}, {role: 'model', content: `Προϊόν: ${result.productName}. Ανάλυση: ${result.analysis}. Συμβουλές: ${result.advice}`}]);
          }
      } catch (error: any) {
          const errorMessage = error?.message || 'Άγνωστο σφάλμα κατά την ανάλυση εικόνας.';
          toast({ 
            title: 'Σφάλμα Ανάλυσης', 
            description: errorMessage, 
            variant: 'destructive',
            action: (
                <ToastAction altText="Αντιγραφή" onClick={() => handleCopyToClipboard(errorMessage)}>
                    <Copy className="h-4 w-4" />
                </ToastAction>
            ),
          });
      } finally {
          setIsLoading(false);
          setQuestion(''); // Clear the textarea after analysis starts
      }
  }, [performQueryCheck, isStreamingText, isStreamingAnalysis, aiResponse, productAnalysis, displayedQuestion, imageForLastResponse, conversationHistory, addQueryToHistory, toast]);


  useEffect(() => {
    if (showCamera) {
      setImageDataUri(null); 
      clearAllOutputs();
      setConversationHistory([]);
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } } });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera (potentially rear camera not available/permitted):', error);
          try {
            console.log("Fallback: Attempting to access any camera.");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          } catch (fallbackError) {
             console.error('Error accessing any camera (fallback):', fallbackError);
             setHasCameraPermission(false);
             setShowCamera(false);
             toast({
                variant: 'destructive',
                title: 'Η Πρόσβαση στην Κάμερα Απαγορεύτηκε',
                description: 'Παρακαλώ ενεργοποιήστε τις άδειες κάμερας στις ρυθμίσεις του περιηγητή σας. Δεν ήταν δυνατή η πρόσβαση ούτε στην πίσω ούτε στην μπροστινή κάμερα.',
             });
          }
        }
      };
      getCameraPermission();
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [showCamera, toast, stopCameraStream]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      stopCameraStream();
      setShowCamera(false);
      setImageDataUri(null);
      toast({ title: 'Επεξεργασία εικόνας...', description: 'Η εικόνα σας προετοιμάζεται για ανάλυση.' });
      try {
        const reader = new FileReader();
        reader.onload = async (loadEvent) => {
          const originalDataUrl = loadEvent.target?.result as string;
          try {
            const resizedDataUrl = await resizeImage(originalDataUrl, 1024, 1024);
            setImageDataUri(resizedDataUrl);
            await startImageAnalysis(resizedDataUrl, question);
          } catch (resizeError) {
             toast({ title: 'Σφάλμα Επεξεργασίας Εικόνας', description: 'Δεν ήταν δυνατή η αλλαγή μεγέθους της εικόνας.', variant: 'destructive' });
          }
        };
        reader.onerror = () => {
             toast({ title: 'Σφάλμα Αρχείου', description: 'Δεν ήταν δυνατή η ανάγνωση του αρχείου.', variant: 'destructive' });
        }
        reader.readAsDataURL(file);
      } catch (error) {
        toast({ title: 'Σφάλμα Επεξεργασίας Εικόνας', description: 'Παρουσιάστηκε σφάλμα κατά την επεξεργασία.', variant: 'destructive' });
      }
    }
    if (event.target) {
      event.target.value = "";
    }
  }, [stopCameraStream, toast, startImageAnalysis, question]);

  const handleCapturePhoto = useCallback(async () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUri = canvas.toDataURL('image/jpeg');
            setShowCamera(false);
            try {
                const resizedDataUrl = await resizeImage(dataUri, 1024, 1024);
                setImageDataUri(resizedDataUrl);
                await startImageAnalysis(resizedDataUrl, question);
            } catch (error) {
                toast({ title: 'Σφάλμα Επεξεργασίας Εικόνας', description: 'Δεν ήταν δυνατή η επεξεργασία της φωτογραφίας.', variant: 'destructive' });
            }
        }
    }
  }, [question, startImageAnalysis, toast]);

  const handleSubmitText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Stop any active streaming
    if (textStreamIntervalRef.current) clearInterval(textStreamIntervalRef.current);
    if (analysisStreamIntervalRef.current) clearInterval(analysisStreamIntervalRef.current);
    setIsStreamingText(false);
    setIsStreamingAnalysis(false);

    if (performQueryCheck()) return;
    
    if (!question.trim()) {
      toast({
        title: 'Απαιτείται Ερώτηση',
        description: 'Παρακαλώ εισάγετε μια ερώτηση.',
        variant: 'destructive',
      });
      return;
    }
    
    // Archive the previous turn if it exists and is complete
    if (!isStreamingText && !isStreamingAnalysis && (aiResponse || productAnalysis)) {
        const previousResponse = aiResponse || productAnalysis;
        if (previousResponse && displayedQuestion) {
            const newPastTurn: PastTurn = {
                id: new Date().toISOString() + Math.random(),
                question: displayedQuestion,
                imageDataUri: imageForLastResponse,
                response: previousResponse,
            };
            setPastTurns(prev => [newPastTurn, ...prev]);
        }
    }

    clearAllOutputs();
    setIsLoading(true);
    setDisplayedQuestion(question);
    const userQuestionForHistory = question;
    setQuestion('');

    const conversationHistoryString = conversationHistory
      .map(turn => `${turn.role === 'user' ? 'User' : 'Model'}: ${turn.content}`)
      .join('\n');
      
    try {
        const result = await getAgroGreekAnswer({ 
          question: userQuestionForHistory, 
          conversationHistory: conversationHistoryString,
          latitude: location?.lat,
          longitude: location?.lon,
        });
        
        await addQueryToHistory({ type: 'text', question: userQuestionForHistory, response: result });

        if ('error' in result) {
          toast({ 
            title: 'Σφάλμα από τον Phyt', 
            description: result.error, 
            variant: 'destructive',
            action: (
                <ToastAction altText="Αντιγραφή" onClick={() => handleCopyToClipboard(result.error)}>
                    <Copy className="h-4 w-4" />
                </ToastAction>
            ),
          });
          setConversationHistory(prev => [...prev, {role: 'user', content: userQuestionForHistory}, {role: 'model', content: `Σφάλμα: ${result.error}`}]);
        } else {
          setAiResponse(result);
          setImageForLastResponse(null); // No image for this response
          toast({ title: 'Ο Phyt Απάντησε!', description: 'Η απάντηση είναι έτοιμη.' });
          setConversationHistory(prev => [...prev, {role: 'user', content: userQuestionForHistory}, {role: 'model', content: result.answer}]);
        }
    } catch (error: any) {
        console.error("Error during AI call in AgroAIGreek component:", error);
        let errorMessage = "Άγνωστο σφάλμα κατά την επικοινωνία με τον Phyt. Ελέγξτε τη σύνδεσή σας.";
        if (error && typeof error.error === 'string') { 
            errorMessage = error.error;
        } else if (error && typeof error.message === 'string') {
            errorMessage = error.message;
        }
        toast({
            title: 'Σφάλμα Επικοινωνίας',
            description: "Παρουσιάστηκε σφάλμα: " + errorMessage,
            variant: 'destructive',
            action: (
                <ToastAction altText="Αντιγραφή" onClick={() => handleCopyToClipboard("Παρουσιάστηκε σφάλμα: " + errorMessage)}>
                    <Copy className="h-4 w-4" />
                </ToastAction>
            ),
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleShare = async (content: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: content,
        });
        toast({ title: 'Κοινοποιήθηκε!', description: 'Η συμβουλή κοινοποιήθηκε με επιτυχία.' });
      } catch (error: any) {
        console.error('Error sharing:', error);
        let shareErrorDescription = 'Δεν ήταν δυνατή η κοινοποίηση.';
        if (error.name === 'NotAllowedError' || (error.message && (error.message.toLowerCase().includes('permission denied') || error.message.toLowerCase().includes('share target unavailable')))) {
          shareErrorDescription = 'Η άδεια κοινοποίησης απορρίφθηκε, δεν παραχωρήθηκε, ή δεν βρέθηκε κατάλληλη εφαρμογή. Ελέγξτε τις ρυθμίσεις του περιηγητή/συσκευής σας.';
        } else if (error.message) {
          shareErrorDescription += ` Λεπτομέρειες: ${error.message}`;
        }
        toast({ title: 'Σφάλμα Κοινοποίησης', description: shareErrorDescription, variant: 'destructive', duration: 8000 });
      }
    } else {
      toast({ title: 'Κοινοποίηση μη Διαθέσιμη', description: 'Ο περιηγητής σας δεν υποστηρίζει απευθείας κοινοποίηση. Δοκιμάστε αντιγραφή ή email.', variant: 'default' });
    }
  };

  const handleShareViaEmail = (content: string, subject: string) => {
    const body = encodeURIComponent(content);
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
    window.location.href = mailtoLink;
  };


  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading && question.trim() && !currentLimitReached) {
        handleSubmitText(); 
      }
    }
  };

  let submitButtonText = 'Λήψη Συμβουλής';

  const renderShareButton = (responseContent: string, responseTitle: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="absolute top-2 right-2 h-8 w-8">
          <Share2 className="h-4 w-4" />
          <span className="sr-only">Κοινοποίηση</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleShare(responseContent, responseTitle)}>
          Κοινοποίηση...
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCopyToClipboard(responseContent)}>
          Αντιγραφή Κειμένου
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShareViaEmail(responseContent, responseTitle)}>
          Αποστολή με Email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const fullAnalysisTextForSharing = `Προϊόν: ${displayedProductName}\n\nΔιάγνωση: ${(productAnalysis?.identifiedProblems || []).join(', ')}\n\nΑνάλυση: ${productAnalysis?.analysis}\n\nΣυμβουλές: ${productAnalysis?.advice}`;

  const renderPastTurnCard = (turn: PastTurn) => {
    const { id, question, imageDataUri, response } = turn;
    const isError = 'error' in response;
    const isImageAnalysis = 'productName' in response;
    const isTextResponse = 'answer' in response;

    let fullResponseTextForShare = '';
    if (isImageAnalysis) {
        const r = response as ExamineProductOutput;
        fullResponseTextForShare = `Προϊόν: ${r.productName}\n\nΔιάγνωση: ${(r.identifiedProblems || []).join(', ')}\n\nΑνάλυση: ${r.analysis}\n\nΣυμβουλές: ${r.advice}`;
    } else if (isTextResponse) {
        fullResponseTextForShare = (response as AskAgroGreekOutput).answer;
    }


    return (
        <div key={id} className="space-y-4 opacity-70">
            <Card className="shadow-md bg-muted/30">
                <CardHeader className="p-4 flex flex-col items-end text-right">
                    {imageDataUri && (
                        <div className="relative mb-2 self-end">
                            <button type="button" onClick={() => handleImageZoom(imageDataUri)} className="cursor-zoom-in rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary">
                              <Image 
                                  src={imageDataUri} 
                                  alt="Past analysis image" 
                                  width={100} 
                                  height={100} 
                                  className="rounded-md object-contain max-h-[100px] max-w-[100px] bg-white dark:bg-slate-800"
                              />
                            </button>
                        </div>
                    )}
                    <p className="text-base font-semibold text-foreground">{question}</p>
                </CardHeader>
            </Card>

            <Card className={cn("shadow-lg bg-primary/5 dark:bg-primary/10 relative")}>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center text-xl">
                        {isImageAnalysis ? <ScanSearch className="mr-3 h-6 w-6 text-primary" /> : <Sparkles className="mr-3 h-6 w-6 text-primary" />}
                        Απάντηση από τον Phyt
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isError && <p className="text-base whitespace-pre-wrap text-destructive">{(response as {error: string}).error}</p>}
                    {isTextResponse && <div className="text-base whitespace-pre-wrap">{(response as AskAgroGreekOutput).answer}</div>}
                    {isImageAnalysis && (
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">ΠΡΟΪΟΝ</p>
                                <p className="text-lg font-semibold text-foreground mt-1">{(response as ExamineProductOutput).productName}</p>
                            </div>
                            {(response as ExamineProductOutput).identifiedProblems && (response as ExamineProductOutput).identifiedProblems.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">ΔΙΑΓΝΩΣΗ</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {(response as ExamineProductOutput).identifiedProblems.map((problem, index) => (
                                            <Badge key={index} variant="destructive" className="text-base px-3 py-1">
                                            {problem}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">ΑΝΑΛΥΣΗ</p>
                                <p className="text-base whitespace-pre-wrap mt-1">{(response as ExamineProductOutput).analysis}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">ΣΥΜΒΟΥΛΕΣ</p>
                                <p className="text-base whitespace-pre-wrap mt-1">{(response as ExamineProductOutput).advice}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
                 {renderShareButton(fullResponseTextForShare, "Phyt AI - Αποτέλεσμα από Ιστορικό")}
            </Card>
        </div>
    );
  };

  const isAgronomistOrCompany = user?.role === 'agronomist' || user?.role === 'agronomist-trial' || user?.role === 'agronomist-premium' || user?.role === 'company';
  const isFarmer = user?.role === 'farmer' || user?.role === 'farmer-pro';
  const isAdmin = user?.email?.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase();


  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 bg-background/80 backdrop-blur-sm p-2">
            <div className="flex items-center justify-end gap-1">
                {isAgronomistOrCompany && (
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/agronomist-inbox"><Inbox className="h-4 w-4 mr-2" />Εισερχόμενα</Link>
                    </Button>
                )}
                {isFarmer && (
                     <Button variant="ghost" size="sm" onClick={handleOpenAgronomistConnectionDialog}>
                         <Briefcase className="h-4 w-4 mr-2" />Ο Γεωπόνος μου
                     </Button>
                )}
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/smart-crop-planning"><Map className="h-4 w-4 mr-2" />Ανάλυση Αγρού</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/agroassist"><ListOrdered className="h-4 w-4 mr-2" />Οι Παραγγελίες μου</Link>
                </Button>
            </div>
        </div>

      {/* Response Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {pastTurns.map(turn => renderPastTurnCard(turn))}

        {displayedQuestion && (
          <Card className="animate-fadeIn shadow-md bg-muted/30">
            <CardHeader className="p-4">
              <p className="text-base font-semibold text-right text-foreground">{displayedQuestion}</p>
            </CardHeader>
          </Card>
        )}

        {isLoading && (
          <Card className="shadow-lg animate-fadeIn">
            <CardHeader>
              <CardTitle className="font-headline flex items-center text-xl">
                <Loader2 className="mr-3 h-6 w-6 animate-spin text-primary" />
                Ο Phyt επεξεργάζεται το αίτημά σας...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Παρακαλώ περιμένετε όσο ο Phyt αναλύει τα δεδομένα σας.</p>
              <div className="mt-4 space-y-3">
                <div className="h-4 bg-muted/50 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-muted/50 rounded w-1/2 animate-pulse"></div>
                <div className="h-4 bg-muted/50 rounded w-5/6 animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && aiResponse && (
          <Card className={cn("shadow-lg bg-primary/5 dark:bg-primary/10", "animate-fadeIn relative")}>
            <CardHeader>
              <CardTitle className="font-headline flex items-center text-xl">
                <Sparkles className="mr-3 h-6 w-6 text-primary" />
                Απάντηση από τον Phyt:
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base whitespace-pre-wrap">
                {displayedAnswer}
                {isStreamingText && (
                  <span className="inline-block w-2.5 h-5 bg-primary animate-pulse ml-1 align-bottom" />
                )}
              </div>
               {aiResponse.imageUrl && (
                 <div className="mt-4">
                    <button type="button" onClick={() => handleImageZoom(aiResponse.imageUrl)} className="cursor-zoom-in rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary w-full max-w-sm">
                        <Image 
                            src={aiResponse.imageUrl}
                            alt="AI generated image"
                            width={512}
                            height={512}
                            className="rounded-lg object-contain w-full h-auto bg-slate-200"
                        />
                    </button>
                 </div>
              )}
            </CardContent>
            {renderShareButton(aiResponse.answer, "Phyt AI - Συμβουλή")}
          </Card>
        )}

        {!isLoading && productAnalysis && (
          <Card className={cn("shadow-lg bg-accent/5 dark:bg-accent/10", "animate-fadeIn relative")}>
            <CardHeader>
              <CardTitle className="font-headline flex items-center text-xl">
                <ScanSearch className="mr-3 h-6 w-6 text-primary" />
                Ανάλυση Εικόνας από τον Phyt:
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 items-start">
               <button type="button" onClick={() => handleImageZoom(imageForLastResponse)} className="cursor-zoom-in rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                  <Image
                      src={imageForLastResponse || "https://placehold.co/400x400.png"}
                      alt="Product for analysis"
                      width={128}
                      height={128}
                      className="rounded-lg object-cover w-full h-full bg-white dark:bg-slate-800"
                  />
               </button>
               <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ΠΡΟΪΟΝ</p>
                    <p className="text-lg font-semibold text-foreground mt-1">{displayedProductName}</p>
                  </div>
                  {productAnalysis.identifiedProblems && productAnalysis.identifiedProblems.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ΔΙΑΓΝΩΣΗ</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {productAnalysis.identifiedProblems.map((problem, index) => (
                          <Badge key={index} variant="destructive" className="text-base px-3 py-1">{problem}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ΑΝΑΛΥΣΗ</p>
                    <p className="text-base whitespace-pre-wrap mt-1">
                      {displayedAnalysisText}
                      {isStreamingAnalysis && displayedAdviceText.length === 0 && <span className="inline-block w-2.5 h-5 bg-primary animate-pulse ml-1 align-bottom" />}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ΣΥΜΒΟΥΛΕΣ</p>
                    <p className="text-base whitespace-pre-wrap mt-1">
                      {displayedAdviceText}
                      {isStreamingAnalysis && displayedAdviceText.length > 0 && displayedAdviceText.length < (productAnalysis?.advice.length || 0) && <span className="inline-block w-2.5 h-5 bg-primary animate-pulse ml-1 align-bottom" />}
                    </p>
                  </div>
               </div>
            </CardContent>
            {renderShareButton(fullAnalysisTextForSharing, "Phyt AI - Ανάλυση Προϊόντος")}
            <CardFooter className="p-4 border-t mt-4 flex flex-col items-center gap-2">
                <Button 
                    onClick={handleOpenSendToAgronomistDialog}
                    disabled={!isAuthenticated || isAgronomistOrCompany}
                    className="w-full"
                >
                    <MessageSquareQuote className="mr-2 h-4 w-4" />
                    Αποστολή στον Γεωπόνο για Συνταγή
                </Button>
                
            </CardFooter>
          </Card>
        )}
      </div>

      {/* Input Form Area */}
      <div className="flex-shrink-0 bg-background/95 p-4 border-t">
        <form onSubmit={handleSubmitText} className="space-y-2">
          <div className="flex items-start gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              disabled={currentLimitReached || isLoading}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Μεταφόρτωση Εικόνας"
            >
              <ImageUp className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              disabled={currentLimitReached || isLoading}
              onClick={() => setShowCamera(true)}
              aria-label="Χρήση Κάμερας"
            >
              <Camera className="h-5 w-5" />
            </Button>
            <Textarea
              placeholder="Ρωτήστε ή σκανάρετε με τον Phyt για να πάρετε γεωπονικές-αγροτικές συμβουλές"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="text-base min-h-[40px] resize-none"
              disabled={currentLimitReached || isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="flex-shrink-0"
              disabled={isLoading || !question.trim() || currentLimitReached}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              <span className="sr-only">{submitButtonText}</span>
            </Button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={currentLimitReached || isLoading}
          />
          
          {showCamera && (
            <div className="space-y-2 p-2 border-t mt-2">
              <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              {hasCameraPermission === false && (
                <Alert variant="destructive">
                  <AlertTitle>Απαιτείται Άδεια Κάμερας</AlertTitle>
                  <AlertDescription>
                    Παρακαλώ επιτρέψτε την πρόσβαση στην κάμερα.
                  </AlertDescription>
                </Alert>
              )}
              {hasCameraPermission && (
                <div className="flex gap-2">
                  <Button type="button" onClick={() => setShowCamera(false)} variant="outline" className="w-full">
                    <X className="mr-2 h-4 w-4" /> Άκυρο
                  </Button>
                  <Button type="button" onClick={handleCapturePhoto} className="w-full" disabled={currentLimitReached || isLoading}>
                    <Camera className="mr-2 h-4 w-4" /> Λήψη
                  </Button>
                </div>
              )}
            </div>
          )}
        </form>

        {isClient && currentLimitReached && !isAdmin && (
          <Alert variant="default" className="mt-2 text-xs bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300">
            <FileWarning className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="font-semibold text-xs">Έχετε φτάσει το ημερήσιο όριο</AlertTitle>
            <AlertDescription>
              <Link href="/pricing" className="underline hover:no-underline">Αναβαθμίστε</Link> για περισσότερες ερωτήσεις.
            </AlertDescription>
          </Alert>
        )}
      </div>
    
    <Dialog open={isZoomModalOpen} onOpenChange={handleZoomOpenChange}>
      <DialogContent
        className="max-w-4xl w-full h-full max-h-[90vh] p-0 bg-transparent border-0 shadow-none overflow-hidden select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleZoomOpenChange(false);
          }
        }}
      >
        <div
            className="w-full h-full"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
        >
            <button
                onClick={() => handleZoomOpenChange(false)}
                className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-black/50 p-2 text-white transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Κλείσιμο προβολής zoom"
            >
                <X className="h-full w-full" />
            </button>
            {zoomedImageUri && (
            <Image
                ref={imageRef}
                src={zoomedImageUri}
                alt="Zoomed image"
                width={1200}
                height={1200}
                className="rounded-lg object-contain w-full h-full transition-transform duration-100 ease-linear"
                style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                transformOrigin: '0 0',
                cursor: isPanning ? 'grabbing' : transform.scale > 1 ? 'grab' : 'default',
                }}
                onMouseDown={handleMouseDown}
                draggable="false"
            />
            )}
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={isSendToAgronomistDialogOpen} onOpenChange={setIsSendToAgronomistDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Επιλογή Γεωπόνου</DialogTitle>
          <DialogDescription>
            Επιλέξτε τον γεωπόνο στον οποίο θέλετε να στείλετε την ανάλυση του Phyt για έλεγχο και δημιουργία συνταγής.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="agronomist-select">Διαθέσιμοι Γεωπόνοι</Label>
          <Popover open={agronomistPopoverOpen} onOpenChange={setAgronomistPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={agronomistPopoverOpen}
                className="w-full justify-between"
              >
                {selectedAgronomistId
                  ? availableAgronomists.find((a) => a.id === selectedAgronomistId)?.name
                  : "Αναζήτηση & επιλογή γεωπόνου..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput 
                  placeholder="Αναζήτηση με όνομα, email, τηλ..." 
                  value={agronomistSearchValue}
                  onValueChange={setAgronomistSearchValue}
                />
                <CommandEmpty>Δεν βρέθηκε γεωπόνος.</CommandEmpty>
                <CommandGroup>
                  {availableAgronomists
                    .filter(a => {
                      const searchTerm = agronomistSearchValue.toLowerCase();
                      if (!searchTerm) return true;
                      return (
                        a.name.toLowerCase().includes(searchTerm) ||
                        a.email.toLowerCase().includes(searchTerm)
                      );
                    })
                    .map((agronomist) => (
                    <CommandItem
                      key={agronomist.id}
                      value={agronomist.name}
                      onSelect={() => {
                        setSelectedAgronomistId(agronomist.id);
                        setAgronomistPopoverOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedAgronomistId === agronomist.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {agronomist.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsSendToAgronomistDialogOpen(false)}>Ακύρωση</Button>
          <Button onClick={handleConfirmSendToAgronomist} disabled={!selectedAgronomistId}>Αποστολή Αιτήματος</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={isAgronomistSelectorOpen} onOpenChange={setIsAgronomistSelectorOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Σύνδεση με Γεωπόνο</DialogTitle>
          <DialogDescription>
            Επιλέξτε τον γεωπόνο με τον οποίο θέλετε να συνεργαστείτε. Αυτή η επιλογή μπορεί να αλλαχθεί αργότερα από τις ρυθμίσεις.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="agronomist-connect-select">Διαθέσιμοι Γεωπόνοι</Label>
          <Popover open={agronomistPopoverOpen} onOpenChange={setAgronomistPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                id="agronomist-connect-select"
                aria-expanded={agronomistPopoverOpen}
                className="w-full justify-between"
              >
                {selectedAgronomistId
                  ? availableAgronomists.find((a) => a.id === selectedAgronomistId)?.name
                  : "Αναζήτηση & επιλογή γεωπόνου..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput 
                  placeholder="Αναζήτηση με όνομα, email, τηλ..." 
                  value={agronomistSearchValue}
                  onValueChange={setAgronomistSearchValue}
                />
                <CommandEmpty>Δεν βρέθηκε γεωπόνος.</CommandEmpty>
                <CommandGroup>
                  {availableAgronomists
                    .filter(a => {
                      const searchTerm = agronomistSearchValue.toLowerCase();
                      if (!searchTerm) return true;
                      return (
                        a.name.toLowerCase().includes(searchTerm) ||
                        a.email.toLowerCase().includes(searchTerm)
                      );
                    })
                    .map((agronomist) => (
                    <CommandItem
                      key={agronomist.id}
                      value={agronomist.name}
                      onSelect={() => {
                        setSelectedAgronomistId(agronomist.id);
                        setAgronomistPopoverOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedAgronomistId === agronomist.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {agronomist.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAgronomistSelectorOpen(false)}>Ακύρωση</Button>
          <Button onClick={handleConfirmAgronomistConnection} disabled={!selectedAgronomistId}>Επιβεβαίωση Σύνδεσης</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
  );
}
