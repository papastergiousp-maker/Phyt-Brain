
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAgroStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Eye, Trash2, Edit3, Printer, CheckSquare, Loader2, Send, Check, MessageSquareQuote, PlayCircle, Image as ImageIcon, PlusCircle, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import type { Order, OrderItem, OrderStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/shared/logo';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { savedOrders, isLoadingOrders, deleteOrder, loadOrderForEditing, markOrderAsCompleted, acceptOrder, clearOrderForm, loadOrderAsTemplate } = useAgroStore(state => ({
    savedOrders: state.savedOrders,
    isLoadingOrders: state.isLoadingOrders,
    deleteOrder: state.deleteOrder,
    loadOrderForEditing: state.loadOrderForEditing,
    markOrderAsCompleted: state.markOrderAsCompleted,
    acceptOrder: state.acceptOrder,
    clearOrderForm: state.clearOrderForm,
    loadOrderAsTemplate: state.loadOrderAsTemplate,
  }));
  
  const router = useRouter();
  const { toast } = useToast();

  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const userOrders = useMemo(() => {
    if (!user) return [];
    
    const isProfessional = user.role === 'agronomist' || user.role === 'agronomist-trial' || user.role === 'agronomist-premium' || user.role === 'company';
    
    if (isProfessional) {
        return savedOrders.filter(order => order.createdBy === user.uid || order.agronomistId === user.uid);
    }
    
    return savedOrders.filter(order => order.producerId === user.uid);
    
  }, [user, savedOrders]);
  
  const handleNewOrderClick = () => {
    clearOrderForm();
    router.push('/agroassist');
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrderForDetails(order);
    setIsDetailsDialogOpen(true);
  };

  const handleDeleteOrder = async (orderId: string) => {
    deleteOrder(orderId);
  };

  const handleEditOrder = (order: Order) => {
    loadOrderForEditing(order);
    router.push('/agroassist');
    toast({
      title: "Η Παραγγελία Φορτώθηκε",
      description: `Η παραγγελία ${order.id.substring(0,8)}... είναι έτοιμη για επεξεργασία.`,
    });
  };

  const handleNewSimilarOrder = (order: Order) => {
    loadOrderAsTemplate(order);
    router.push('/agroassist');
    toast({
        title: "Δημιουργία Νέας Παρόμοιας Παραγγελίας",
        description: `Τα στοιχεία από την παλιά παραγγελία φορτώθηκαν. Αποθηκεύστε για να δημιουργηθεί η νέα.`,
    });
  };

  const handleMarkAsCompleted = async (orderId: string) => {
    markOrderAsCompleted(orderId);
  };
  
  const handleAcceptOrder = async (orderId: string) => {
    acceptOrder(orderId);
    toast({
        title: "Η Παραγγελία Εγκρίθηκε!",
        description: "Η παραγγελία προχωρά για συλλογή και αποστολή.",
        variant: 'default',
    });
  };

  const handlePrintSelectedOrder = (orderToPrint: Order | null) => {
    if (!orderToPrint) {
      toast({
        title: "Σφάλμα Εκτύπωσης",
        description: "Δεν έχει επιλεχθεί παραγγελία για εκτύπωση.",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Σύνοψη Παραγγελίας</title>');
      printWindow.document.write(`
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          h1 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
          h2, h3, h4 { color: #555; margin-top: 20px; }
          p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; margin-top: 15px; }
          .notes-section { margin-top: 20px; padding: 10px; border: 1px solid #eee; background-color: #f9f9f9; }
          .ai-recs { margin-top: 20px; padding: 10px; border: 1px dashed #BDB76B; background-color: #FFFDE7; }
          .completed-info { margin-top: 10px; font-size: 0.9em; }
          ul { padding-left: 20px; }
          pre { white-space: pre-wrap; word-wrap: break-word; font-family: Arial, sans-serif; margin: 0; }
          .analysis-image { max-width: 200px; max-height: 200px; border-radius: 4px; margin-top: 10px; }
          @media print {
            .no-print-in-popup { display: none; }
            button { display: none; }
          }
        </style>
      `);
      printWindow.document.write('</head><body>');
      printWindow.document.write('<h1>Σύνοψη Παραγγελίας AgroAssist</h1>');
      printWindow.document.write(`<p><strong>ID Παραγγελίας:</strong> ${orderToPrint.id}</p>`);
      if (orderToPrint.createdAt) {
        printWindow.document.write(`<p><strong>Ημερομηνία:</strong> ${format(new Date(orderToPrint.createdAt), "dd MMM yyyy, HH:mm")}</p>`);
      }
      if (orderToPrint.deliveryDate) {
        printWindow.document.write(`<p><strong>Ημερομηνία Παράδοσης:</strong> ${format(new Date(orderToPrint.deliveryDate), "PPP", { locale: el })}</p>`);
      }
      if (orderToPrint.customerName) printWindow.document.write(`<p><strong>Πελάτης:</strong> ${orderToPrint.customerName}</p>`);
      if (orderToPrint.customerEmail) printWindow.document.write(`<p><strong>Email:</strong> ${orderToPrint.customerEmail}</p>`);
      if (orderToPrint.customerPhoneNumber) printWindow.document.write(`<p><strong>Τηλέφωνο:</strong> ${orderToPrint.customerPhoneNumber}</p>`);
      if (orderToPrint.location) printWindow.document.write(`<p><strong>Τοποθεσία:</strong> ${orderToPrint.location}</p>`);
      if (orderToPrint.areaSize > 0) printWindow.document.write(`<p><strong>Μέγεθος Έκτασης:</strong> ${orderToPrint.areaSize} στρέμματα</p>`);
      if (orderToPrint.createdByName) printWindow.document.write(`<p><strong>Δημιουργήθηκε από:</strong> ${orderToPrint.createdByName}</p>`);
      if (orderToPrint.agronomistName) printWindow.document.write(`<p><strong>Αποστολή σε:</strong> ${orderToPrint.agronomistName}</p>`);

      printWindow.document.write(`<p><strong>Κατάσταση:</strong> ${orderToPrint.status || 'Εκκρεμεί'}</p>`);
      if (orderToPrint.status === 'Completed') {
        if(orderToPrint.completedByName) printWindow.document.write(`<p class="completed-info"><strong>Ολοκληρώθηκε από:</strong> ${orderToPrint.completedByName}</p>`);
        if(orderToPrint.completedAt) printWindow.document.write(`<p class="completed-info"><strong>Ολοκληρώθηκε στις:</strong> ${format(new Date(orderToPrint.completedAt), "dd MMM yyyy, HH:mm")}</p>`);
      }

      printWindow.document.write('<h2>Επιλεγμένα Προϊόντα:</h2>');
      if (orderToPrint.items.length > 0) {
        printWindow.document.write('<table><thead><tr><th>Προϊόν</th><th>Ποσότητα</th><th>Μονάδα</th><th>Βάρος</th></tr></thead><tbody>');
        orderToPrint.items.forEach(item => {
          let displayAmount = '';
          let displayUnit = '';
          const weightText = item.totalWeight ? `${item.totalWeight.toLocaleString()} kg` : '-';
  
          if (item.calculatedPackages > 0) {
              displayAmount = `${item.calculatedPackages}`;
              displayUnit = item.unit || 'Τεμάχια';
          } else if (item.totalAmountNeeded && item.amountUnit) {
              let amount = item.totalAmountNeeded;
              let unit: string = item.amountUnit;
              if (unit === 'ml' && amount >= 1000) {
                  amount /= 1000;
                  unit = 'L';
              } else if (unit === 'g' && amount >= 1000) {
                  amount /= 1000;
                  unit = 'kg';
              }
              displayAmount = amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
              displayUnit = unit;
          } else {
              displayAmount = '1';
              displayUnit = 'Τεμάχιο (Μη υπολογίσιμη δόση)';
          }
          
          printWindow.document.write(`<tr><td>${item.productName}</td><td>${displayAmount}</td><td>${displayUnit}</td><td>${weightText}</td></tr>`);
        });
        printWindow.document.write('</tbody></table>');
        printWindow.document.write(`<div class="total">Σύνολο Πακέτων/Μονάδων: ${orderToPrint.totalCalculatedPackages}</div>`);
        if (orderToPrint.totalWeight && orderToPrint.totalWeight > 0) {
          printWindow.document.write(`<div class="total">Συνολικό Βάρος: ${orderToPrint.totalWeight.toLocaleString()} kg</div>`);
        }
      } else {
        printWindow.document.write('<p>Δεν υπάρχουν προϊόντα σε αυτή την παραγγελία.</p>');
      }

      if (orderToPrint.imageDataUri) {
        printWindow.document.write('<h3>Εικόνα Αιτήματος:</h3>');
        printWindow.document.write(`<img src="${orderToPrint.imageDataUri}" alt="Εικόνα Αιτήματος" class="analysis-image" />`);
      }
      
      if (orderToPrint.additionalOrderNotes && orderToPrint.additionalOrderNotes.trim() !== '') {
        printWindow.document.write('<div class="notes-section"><h3>Πρόσθετες Σημειώσεις:</h3><pre>' + orderToPrint.additionalOrderNotes + '</pre></div>');
      }

      if (orderToPrint.aiRecommendations && orderToPrint.aiRecommendations.length > 0) {
        printWindow.document.write('<div class="ai-recs"><h3>Προτάσεις AI:</h3><ul>');
        orderToPrint.aiRecommendations.forEach((rec, index) => printWindow.document.write(`<li key=${index}>${rec}</li>`));
        printWindow.document.write('</ul></div>');
      }

      printWindow.document.write('<hr class="no-print-in-popup" style="margin-top: 20px;">');
      printWindow.document.write('<button class="no-print-in-popup" onclick="window.print()">Εκτύπωση</button> ');
      printWindow.document.write('<button class="no-print-in-popup" onclick="window.close()">Κλείσιμο</button>');
      printWindow.document.write('</body></html>');
      printWindow.document.close();
    } else {
      toast({
        title: "Σφάλμα Εκτύπωσης",
        description: "Δεν ήταν δυνατό το άνοιγμα του παραθύρου εκτύπωσης. Ελέγξτε τις ρυθμίσεις pop-up του περιηγητή σας.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Completed': return 'bg-green-600 hover:bg-green-700 text-white';
      case 'Awaiting Producer Approval': return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'Collecting and Shipping': return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'Pending': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'Help Request': return 'bg-purple-600 hover:bg-purple-700 text-white';
      default: return 'bg-gray-500';
    }
  };
  
  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'Completed': return 'Ολοκληρώθηκε';
      case 'Awaiting Producer Approval': return 'Αναμονή Έγκρισης';
      case 'Collecting and Shipping': return 'Συλλογή & Αποστολή';
      case 'Pending': return 'Εκκρεμεί';
      case 'Help Request': return 'Αίτημα Βοήθειας';
      default: return status;
    }
  }

  if (authLoading || isLoadingOrders) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!user) {
    // This check is a safeguard. The root layout should handle redirects,
    // but this prevents a crash if the component renders before the redirect happens.
    return (
        <div className="container mx-auto p-4 py-6 md:p-8 md:py-10">
            <PageHeader
            title="Οι Αποθηκευμένες μου Παραγγελίες"
            description="Δείτε, επεξεργαστείτε ή διαγράψτε τις αποθηκευμένες παραγγελίες σας."
            />
            <Card>
            <CardHeader>
                <CardTitle>Άρνηση Πρόσβασης</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Παρακαλώ συνδεθείτε για να δείτε τις παραγγελίες σας.</p>
                <Button asChild className="mt-4">
                <Link href="/login">Σύνδεση</Link>
                </Button>
            </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 py-6 md:p-8 md:py-10">
    <PageHeader
        title={user.role === 'farmer' ? "Οι Παραγγελίες μου" : "Αποθηκευμένες Παραγγελίες"}
        description={user.role === 'farmer' 
            ? "Δείτε τις παραγγελίες και τις συνταγές που έχετε λάβει από τον γεωπόνο σας."
            : "Δείτε, επεξεργαστείτε ή διαγράψτε τις αποθηκευμένες παραγγελίες σας."
        }
    >
        <Button onClick={handleNewOrderClick}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Νέα Παραγγελία
        </Button>
    </PageHeader>
    <Card>
        <CardHeader>
        <CardTitle>Ιστορικό Παραγγελιών</CardTitle>
            <CardDescription>
            {userOrders.length > 0
                ? `Βρέθηκαν ${userOrders.length} παραγγελίες.`
                : "Δεν έχετε ακόμη παραγγελίες."}
            </CardDescription>
        </CardHeader>
        <CardContent>
        {userOrders.length > 0 ? (
            <ScrollArea className="max-h-[65vh] rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Ημερομηνία</TableHead>
                    <TableHead>Πελάτης</TableHead>
                    <TableHead>Εικόνα</TableHead>
                    <TableHead>Κατάσταση</TableHead>
                    <TableHead className="text-right">Ενέργειες</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {userOrders.map((order) => (
                    <TableRow key={order.id} className={order.status === 'Completed' ? 'bg-green-50 dark:bg-green-900/30' : ''}>
                    <TableCell>{order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy, HH:mm") : 'N/A'}</TableCell>
                    <TableCell>{order.customerName || 'N/A'}</TableCell>
                    <TableCell>
                        {order.imageDataUri ? (
                        <div className="w-12 h-12 rounded-md bg-muted/30 flex items-center justify-center border">
                            <Image src={order.imageDataUri} alt={`Εικόνα για την παραγγελία ${order.id}`} width={48} height={48} className="rounded-md object-cover" />
                        </div>
                        ) : (
                        <div className="w-12 h-12 rounded-md bg-muted/30 flex items-center justify-center border text-muted-foreground">
                            <ImageIcon className="w-6 h-6" />
                        </div>
                        )}
                    </TableCell>
                    <TableCell>
                        <Badge variant={'default'} className={cn(getStatusBadge(order.status))}>
                        {getStatusText(order.status)}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                        {order.status === 'Awaiting Producer Approval' && order.producerId === user.uid && (
                        <Button size="sm" onClick={() => handleAcceptOrder(order.id)} className="bg-green-600 hover:bg-green-700">
                            <Check className="h-4 w-4 mr-2" /> Αποδοχή Παραγγελίας
                        </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleViewOrderDetails(order)} title="Προβολή Λεπτομερειών">
                        <Eye className="h-4 w-4" />
                        </Button>
                        {order.createdBy === user.uid && (
                        <Button variant="ghost" size="icon" onClick={() => handleNewSimilarOrder(order)} title="Δημιουργία Νέας Όμοιας">
                            <Copy className="h-4 w-4" />
                        </Button>
                        )}
                        {order.status === 'Pending' && order.createdBy === user.uid && (
                        <Button variant="ghost" size="icon" onClick={() => handleEditOrder(order)} title="Επεξεργασία Παραγγελίας">
                            <Edit3 className="h-4 w-4" />
                        </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handlePrintSelectedOrder(order)} title="Εκτύπωση Παραγγελίας">
                        <Printer className="h-4 w-4" />
                        </Button>
                        {order.status === 'Pending' && order.createdBy === user.uid && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMarkAsCompleted(order.id)}
                            title="Σήμανση ως Ολοκληρωμένη"
                        >
                            <CheckSquare className="h-4 w-4" />
                        </Button>
                        )}
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Διαγραφή Παραγγελίας" className="text-destructive hover:text-destructive/90">
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
                            <AlertDialogDescription>
                                Αυτή η ενέργεια δεν αναιρείται. Αυτό θα διαγράψει οριστικά την παραγγελία ${order.id.substring(0,8)}...
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Ακύρωση</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteOrder(order.id)} className="bg-destructive hover:bg-destructive/90">
                                Διαγραφή
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </ScrollArea>
        ) : (
            <p className="text-center text-muted-foreground py-8">
            Δεν έχουν αποθηκευτεί παραγγελίες. Δημιουργήστε μια νέα παραγγελία και κάντε κλικ στο "Αποθήκευση Παραγγελίας".
            </p>
        )}
        </CardContent>
    </Card>

    {selectedOrderForDetails && (
        <AlertDialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader className="items-center sm:items-start">
            <Logo />
            <AlertDialogTitle className="pt-2">Λεπτομέρειες Παραγγελίας: {selectedOrderForDetails.id.substring(0,8)}...</AlertDialogTitle>
            <AlertDialogDescription>
                <span className="block">Αποθηκεύτηκε στις: {selectedOrderForDetails.createdAt ? format(new Date(selectedOrderForDetails.createdAt), "dd MMM yyyy, HH:mm:ss") : 'N/A'}</span>
                {selectedOrderForDetails.agronomistName && <span className="block">Απεστάλη σε: {selectedOrderForDetails.agronomistName}</span>}
                {selectedOrderForDetails.deliveryDate && <span className="block">Ημερομηνία Παράδοσης: {format(new Date(selectedOrderForDetails.deliveryDate), "PPP", { locale: el })}</span>}
                {selectedOrderForDetails.customerName && <span className="block">Πελάτης: {selectedOrderForDetails.customerName}</span>}
                {selectedOrderForDetails.customerEmail && <span className="block">Email: {selectedOrderForDetails.customerEmail}</span>}
                {selectedOrderForDetails.customerPhoneNumber && <span className="block">Τηλέφωνο: {selectedOrderForDetails.customerPhoneNumber}</span>}
                {selectedOrderForDetails.location && <span className="block">Τοποθεσία: {selectedOrderForDetails.location}</span>}
                {selectedOrderForDetails.createdByName && <span className="block">Δημιουργήθηκε από: {selectedOrderForDetails.createdByName}</span>}
                {selectedOrderForDetails.areaSize > 0 && <span className="block">Μέγεθος Έκτασης: {selectedOrderForDetails.areaSize} στρέμματα</span>}
                <span className="block font-medium mt-1">Κατάσταση: {getStatusText(selectedOrderForDetails.status)}</span>
                {selectedOrderForDetails.status === 'Completed' && (
                  <>
                    {selectedOrderForDetails.completedByName && <span className="block text-xs">Ολοκληρώθηκε από: {selectedOrderForDetails.completedByName}</span>}
                    {selectedOrderForDetails.completedAt && <span className="block text-xs">Ολοκληρώθηκε στις: {format(new Date(selectedOrderForDetails.completedAt), "dd MMM yyyy, HH:mm")}</span>}
                  </>
                )}
            </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4 max-h-[300px] overflow-y-auto text-sm">
            {selectedOrderForDetails.imageDataUri && (
                <div className="mb-3">
                <h4 className="font-semibold mb-1">Εικόνα Αιτήματος:</h4>
                <Image 
                    src={selectedOrderForDetails.imageDataUri} 
                    alt="Εικόνα Αιτήματος" 
                    width={200}
                    height={200}
                    className="rounded-md object-contain border bg-white"
                />
                </div>
            )}
            {selectedOrderForDetails.audioDataUri && (
                <div className="mb-3">
                    <h4 className="font-semibold mb-1 flex items-center"><PlayCircle className="w-4 h-4 mr-1.5"/>Ηχογραφημένη Παραγγελία:</h4>
                    <audio controls src={selectedOrderForDetails.audioDataUri} className="w-full">
                        Ο περιηγητής σας δεν υποστηρίζει το στοιχείο ήχου.
                    </audio>
                </div>
            )}
            <h4 className="font-semibold mb-2">Είδη:</h4>
            {selectedOrderForDetails.items.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                {selectedOrderForDetails.items.map((item: OrderItem, index: number) => {
                    let quantityDisplay = '';
                    if (item.calculatedPackages > 0) {
                        const weightText = item.totalWeight ? ` - ${item.totalWeight.toLocaleString()} kg` : '';
                        quantityDisplay = `${item.calculatedPackages} ${item.unit || 'Τεμάχια'}${weightText}`;
                    } else if (item.totalAmountNeeded && item.amountUnit) {
                        let amount = item.totalAmountNeeded;
                        let unit: string = item.amountUnit;
                        if (unit === 'ml' && amount >= 1000) {
                            amount /= 1000;
                            unit = 'L';
                        } else if (unit === 'g' && amount >= 1000) {
                            amount /= 1000;
                            unit = 'kg';
                        }
                        quantityDisplay = `${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${unit}`;
                    } else {
                        quantityDisplay = "1 Τεμάχιο (Μη υπολογίσιμη δόση)";
                    }

                    return (
                        <li key={`${item.productId}-${index}`}>
                        {item.productName}: {quantityDisplay}
                        </li>
                    )
                })}
                </ul>
            ) : (
                <p className="text-muted-foreground">Δεν υπάρχουν είδη σε αυτή την παραγγελία.</p>
            )}
            {selectedOrderForDetails.items.length > 0 && (
                <>
                    <p className="font-semibold mt-2">
                        Σύνολο Υπολογισμένων Πακέτων/Μονάδων: {selectedOrderForDetails.totalCalculatedPackages}
                    </p>
                    {selectedOrderForDetails.totalWeight && selectedOrderForDetails.totalWeight > 0 && (
                        <p className="font-semibold mt-1">
                            Συνολικό Βάρος: {selectedOrderForDetails.totalWeight.toLocaleString()} kg
                        </p>
                    )}
                </>
            )}


            {selectedOrderForDetails.aiAnalysis && selectedOrderForDetails.aiAnalysis.trim() !== '' && (
                <div className="mt-3 pt-3 border-t">
                    <h4 className="font-semibold mb-1">Ανάλυση AI / Ερώτηση Χρήστη:</h4>
                    <pre className="whitespace-pre-wrap break-words text-muted-foreground">{selectedOrderForDetails.aiAnalysis}</pre>
                </div>
            )}

            {selectedOrderForDetails.additionalOrderNotes && selectedOrderForDetails.additionalOrderNotes.trim() !== '' && (
                <div className="mt-3 pt-3 border-t">
                    <h4 className="font-semibold mb-1">Πρόσθετες Σημειώσεις:</h4>
                    <pre className="whitespace-pre-wrap break-words text-muted-foreground">{selectedOrderForDetails.additionalOrderNotes}</pre>
                </div>
            )}

            {selectedOrderForDetails.aiRecommendations && selectedOrderForDetails.aiRecommendations.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                <h4 className="font-semibold mb-1">Προτάσεις AI:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {selectedOrderForDetails.aiRecommendations.map((rec, index) => (
                    <li key={`ai-rec-${index}`}>{rec}</li>
                    ))}
                </ul>
                </div>
            )}
            </div>

            <AlertDialogFooter>
            <AlertDialogCancel>Κλείσιμο</AlertDialogCancel>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
    )}
    </div>
  );
}
