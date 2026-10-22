
"use client";

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAgroStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Camera, Mic, Loader2 } from 'lucide-react';
import { CameraDialog } from '@/components/agroassist/CameraDialog';
import { AudioDialog } from '@/components/agroassist/AudioDialog';
import { useToast } from '@/hooks/use-toast';
import type { ExtractOrderFromImageOutput } from '@/ai/flows/extract-order-from-image-types';
import type { ExtractOrderFromAudioOutput } from '@/ai/flows/extract-order-from-audio-types';
import { Skeleton } from '@/components/ui/skeleton';

const OrderCalculatorForm = dynamic(() => import('@/components/agroassist/OrderCalculatorForm').then(mod => mod.OrderCalculatorForm), {
  ssr: false,
  loading: () => <Skeleton className="h-[500px] w-full" />,
});


export default function AgroAssistPage() {
  const { editingOrderId, clearOrderForm } = useAgroStore(state => ({
      editingOrderId: state.editingOrderId,
      clearOrderForm: state.clearOrderForm,
  }));
  const hasCleared = useRef(false);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [isAudioDialogOpen, setIsAudioDialogOpen] = useState(false);
  const { products, ensureProductsSelected, additionalOrderNotes, setAdditionalOrderNotes, setCurrentOrderAudioUri } = useAgroStore(state => ({
    products: state.products,
    ensureProductsSelected: state.ensureProductsSelected,
    additionalOrderNotes: state.additionalOrderNotes,
    setAdditionalOrderNotes: state.setAdditionalOrderNotes,
    setCurrentOrderAudioUri: state.setCurrentOrderAudioUri,
  }));
  const { toast } = useToast();

  useEffect(() => {
    // This effect ensures that when a user navigates to create a "New Order"
    // the form is cleared, but only once per such navigation.
    // It resets if the user navigates away and comes back to create another new order.
    if (editingOrderId === null && !hasCleared.current) {
      clearOrderForm();
      hasCleared.current = true;
    } else if (editingOrderId !== null) {
      // If we are editing, reset the flag so that the next "New Order" will clear the form.
      hasCleared.current = false;
    }
  }, [editingOrderId, clearOrderForm]);

  const handleScanComplete = (data: ExtractOrderFromImageOutput) => {
    setIsCameraDialogOpen(false);
    const productNamesFromAI = data.items.map(item => item.productName.toLowerCase());
    const matchedProductIds: string[] = [];

    products.forEach(p => {
      if (productNamesFromAI.some(aiName => p.name.toLowerCase().includes(aiName) || aiName.includes(p.name.toLowerCase()))) {
        matchedProductIds.push(p.id);
      }
    });

    if (matchedProductIds.length > 0) {
      ensureProductsSelected(matchedProductIds);
      toast({
        title: "Η Σάρωση Ολοκληρώθηκε",
        description: `Εντοπίστηκαν και προστέθηκαν ${matchedProductIds.length} προϊόντα στην παραγγελία σας.`,
      });
    } else {
      toast({
        title: "Δεν βρέθηκαν προϊόντα",
        description: "Δεν εντοπίστηκαν γνωστά προϊόντα από την εικόνα.",
        variant: "default",
      });
    }
    
    // Append notes
    let notesToAdd = `\n\n--- ΑΠΟΤΕΛΕΣΜΑΤΑ ΣΑΡΩΣΗΣ ---\n`;
    if (data.items.length > 0) {
      notesToAdd += "Εντοπισμένα προϊόντα:\n";
      data.items.forEach(item => {
        notesToAdd += `- ${item.productName} (Ποσότητα: ${item.quantity})\n`;
      });
    }
    if (data.notes) {
      notesToAdd += `\nΆλλες σημειώσεις από τη σάρωση:\n${data.notes}\n`;
    }
    notesToAdd += '---------------------------\n';

    setAdditionalOrderNotes(additionalOrderNotes + notesToAdd);
  };

  const handleAudioScanComplete = (data: ExtractOrderFromAudioOutput, audioDataUri: string) => {
    setIsAudioDialogOpen(false);
    const productNamesFromAI = data.items.map(item => item.productName.toLowerCase());
    const matchedProductIds: string[] = [];

    products.forEach(p => {
      if (productNamesFromAI.some(aiName => p.name.toLowerCase().includes(aiName) || aiName.includes(p.name.toLowerCase()))) {
        matchedProductIds.push(p.id);
      }
    });

    if (matchedProductIds.length > 0) {
      ensureProductsSelected(matchedProductIds);
      toast({
        title: "Η Ηχογράφηση Ολοκληρώθηκε",
        description: `Εντοπίστηκαν και προστέθηκαν ${matchedProductIds.length} προϊόντα στην παραγγελία σας.`,
      });
    } else {
      toast({
        title: "Δεν βρέθηκαν προϊόντα",
        description: "Δεν εντοπίστηκαν γνωστά προϊόντα από την ηχογράφηση.",
        variant: "default",
      });
    }
    
    // Append transcription and notes
    let notesToAdd = `\n\n--- ΑΠΟΤΕΛΕΣΜΑΤΑ ΗΧΟΓΡΑΦΗΣΗΣ ---\n`;
    notesToAdd += `Απομαγνητοφώνηση: ${data.transcription}\n\n`;
    
    if (data.items.length > 0) {
      notesToAdd += "Εντοπισμένα προϊόντα:\n";
      data.items.forEach(item => {
        notesToAdd += `- ${item.productName} (Ποσότητα: ${item.quantity})\n`;
      });
    }
    if (data.notes) {
      notesToAdd += `\nΆλλες σημειώσεις από την ηχογράφηση:\n${data.notes}\n`;
    }
    notesToAdd += '------------------------------------\n';

    setAdditionalOrderNotes(additionalOrderNotes + notesToAdd);
    setCurrentOrderAudioUri(audioDataUri); // Save the audio URI to the store
  };


  const pageTitle = editingOrderId 
    ? `Επεξεργασία Παραγγελίας ${editingOrderId.substring(0, 8)}...` 
    : "Νέα Παραγγελία";
  
  const pageDescription = editingOrderId
    ? "Τροποποιήστε τις λεπτομέρειες αυτής της υπάρχουσας παραγγελίας."
    : "Αναζητήστε προϊόντα, ορίστε το μέγεθος της έκτασης και υπολογίστε τις απαιτούμενες ποσότητες.";

  return (
    <>
        <div className="container mx-auto p-4 py-6 md:p-8 md:py-10">
        <PageHeader 
            title={pageTitle}
            description={pageDescription}
        >
            <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setIsCameraDialogOpen(true)}>
                <Camera className="mr-2 h-4 w-4" />
                Σάρωση Παραγγελίας
            </Button>
            <Button onClick={() => setIsAudioDialogOpen(true)} variant="outline">
                <Mic className="mr-2 h-4 w-4" />
                Ηχογράφηση Παραγγελίας
            </Button>
            </div>
        </PageHeader>
        <OrderCalculatorForm />
        </div>
        <CameraDialog 
            isOpen={isCameraDialogOpen} 
            onOpenChange={setIsCameraDialogOpen}
            onScanComplete={handleScanComplete}
        />
        <AudioDialog
            isOpen={isAudioDialogOpen}
            onOpenChange={setIsAudioDialogOpen}
            onScanComplete={handleAudioScanComplete}
        />
    </>
  );
}
