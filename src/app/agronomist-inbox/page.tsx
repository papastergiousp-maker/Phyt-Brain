
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAgroStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Loader2, AlertCircle, Send } from 'lucide-react';
import { format } from 'date-fns';
import type { Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/hooks/useAuth';
import { ClientNotificationDialog } from '@/app/my-business/_components/ClientNotificationDialog';

export default function AgronomistInboxPage() {
  const { savedOrders, isLoadingOrders, loadOrderForEditing } = useAgroStore(state => ({
    savedOrders: state.savedOrders,
    isLoadingOrders: state.isLoadingOrders,
    loadOrderForEditing: state.loadOrderForEditing,
  }));
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [selectedRequest, setSelectedRequest] = useState<Order | null>(null);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);

  const agronomistHelpRequests = useMemo(() => {
    if (!user) return [];
    return savedOrders.filter(order => 
      order.status === 'Help Request' && order.agronomistId === user.uid
    );
  }, [savedOrders, user]);

  const handleCreatePrescription = (order: Order) => {
    loadOrderForEditing(order);
    router.push('/agroassist');
    toast({
      title: "Το Αίτημα Φορτώθηκε",
      description: `Το αίτημα από τον χρήστη ${order.createdByName} είναι έτοιμο για δημιουργία συνταγής/παραγγελίας.`,
    });
  };

  if (authLoading || isLoadingOrders) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const isProfessional = user?.role === 'agronomist' || user?.role === 'agronomist-trial' || user?.role === 'agronomist-premium' || user?.role === 'company';
  const canSendNotifications = user?.role === 'agronomist';

  if (!user || !isProfessional) {
    return (
        <div className="container mx-auto p-4 py-6 md:p-8 md:py-10">
            <PageHeader title="Εισερχόμενα Μηνύματα" />
            <Card>
            <CardHeader>
                <CardTitle>Άρνηση Πρόσβασης</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Δεν έχετε δικαίωμα προβολής αυτής της σελίδας.</p>
                <Button asChild className="mt-4">
                <Link href="/dashboard">Επιστροφή στον Πίνακα Ελέγχου</Link>
                </Button>
            </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-4 py-6 md:p-8 md:py-10">
        <PageHeader
          title="Εισερχόμενα Μηνύματα"
        >
          {canSendNotifications && (
            <Button onClick={() => setIsNotificationDialogOpen(true)}>
              <Send className="mr-2 h-4 w-4" /> Αποστολή Ειδοποίησης
            </Button>
          )}
        </PageHeader>
        <Card>
          <CardHeader>
            <CardTitle>Αιτήματα Βοήθειας</CardTitle>
            <CardDescription>
              {agronomistHelpRequests.length > 0
                ? `Έχετε ${agronomistHelpRequests.length} εκκρεμή αιτήματα.`
                : "Δεν υπάρχουν νέα αιτήματα από παραγωγούς."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agronomistHelpRequests.length > 0 ? (
              <ScrollArea className="max-h-[65vh] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ημερομηνία</TableHead>
                      <TableHead>Παραγωγός</TableHead>
                      <TableHead>ID Αιτήματος</TableHead>
                      <TableHead className="text-right">Ενέργειες</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agronomistHelpRequests.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy, HH:mm") : 'N/A'}</TableCell>
                        <TableCell>{order.createdByName || 'N/A'}</TableCell>
                        <TableCell className="font-medium truncate" style={{ maxWidth: '150px' }} title={order.id}>
                          {order.id}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(order)} title="Προβολή Ανάλυσης AI">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            {selectedRequest && (
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Ανάλυση AI για {selectedRequest.createdByName}</AlertDialogTitle>
                                      <AlertDialogDescription>Αυτή ήταν η ανάλυση που δημιουργήθηκε από την AI για τον παραγωγό.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <ScrollArea className="max-h-80 my-4 rounded-md border p-4 bg-muted/50">
                                      <pre className="text-sm whitespace-pre-wrap">{selectedRequest.aiAnalysis}</pre>
                                  </ScrollArea>
                                  <AlertDialogFooter>
                                      <Button onClick={() => {
                                          const closeButton = document.querySelector('[data-radix-alert-dialog-content] [data-radix-collection-item]');
                                          if(closeButton instanceof HTMLElement) closeButton.click();
                                      }}>Κλείσιμο</Button>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                            )}
                          </AlertDialog>

                          <Button variant="default" size="sm" onClick={() => handleCreatePrescription(order)} title="Δημιουργία Συνταγής">
                            <Edit className="h-4 w-4 mr-2" /> Δημιουργία Συνταγής
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
                  <p>Δεν υπάρχουν νέα αιτήματα βοήθειας.</p>
                  <p className="text-sm">Είστε ενημερωμένοι!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ClientNotificationDialog
        isOpen={isNotificationDialogOpen}
        setIsOpen={setIsNotificationDialogOpen}
      />
    </>
  );
}
