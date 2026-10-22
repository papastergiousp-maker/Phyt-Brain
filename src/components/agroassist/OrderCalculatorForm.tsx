
"use client";

import { useMemo, useState, useEffect, useCallback, Fragment } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Search, ListFilter, RotateCcw, Printer, Lightbulb, Loader2, Info, MapPin, Save, Edit3, Wheat, Phone, StickyNote, Sprout, Leaf, SprayCan, Tractor, Bug, AlertCircle, Send, Mail, ChevronUp, ChevronDown, Droplets, Check, ChevronsUpDown, Expand, Shrink } from 'lucide-react';
import { useAgroStore, calculateOrderMetrics } from '@/lib/store';
import type { SelectedProduct, Product, OrderItem } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';


const QUICK_ADD_CATEGORIES = [
  { name: "Σπόροι", icon: Sprout },
  { name: "Λιπάσματα", icon: Tractor },
  { name: "Μυκητοκτόνα", icon: Leaf },
  { name: "Εντομοκτόνα", icon: Bug },
  { name: "Ζιζανιοκτόνα", icon: SprayCan },
];


export function OrderCalculatorForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State for the new quick add dialog
  const [selectorDialogOpen, setSelectorDialogOpen] = useState(false);
  const [selectorCategory, setSelectorCategory] = useState<string | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');

  // State for the new production type selector dialog
  const [isProductionSelectorOpen, setIsProductionSelectorOpen] = useState(false);
  const [productionSearchTerm, setProductionSearchTerm] = useState('');
  
  // State for the collapsible cards
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(true); // Changed to true
  const [isQuickAddCollapsed, setIsQuickAddCollapsed] = useState(false);
  const [isNotesCollapsed, setIsNotesCollapsed] = useState(true);
  const [isAiRecsCollapsed, setIsAiRecsCollapsed] = useState(true);

  // State for maximizing product view
  const [productView, setProductView] = useState<'default' | 'maximized'>('default');


  const {
    searchTerm, setSearchTerm,
    selectedCategory, setSelectedCategory,
    selectedProductionType, setSelectedProductionType,
    products,
    loadProducts,
    isLoadingProducts,
    productLoadingError,
    areaSize, setAreaSize,
    customerName, setCustomerName,
    customerEmail, setCustomerEmail,
    customerPhoneNumber, setCustomerPhoneNumber,
    location, setLocation,
    deliveryDate, setDeliveryDate,
    selectedProductsForOrder,
    toggleProductSelection,
    productDoseSelections,
    setProductDoseSelection,
    additionalOrderNotes, setAdditionalOrderNotes,
    aiRecommendations, fetchAIRecommendations,
    isFetchingRecommendations,
    clearOrderForm,
    saveCurrentOrder, 
    editingOrderId,
    isSavingOrder,
    ensureProductsSelected,
    categorizedProductionTypes,
    associatedAgronomistId,
    sendOrderToAgronomist,
  } = useAgroStore();

  const { calculatedOrderItems, orderSummaryText } = useMemo(() => {
    return calculateOrderMetrics(products, selectedProductsForOrder, productDoseSelections, areaSize);
  }, [products, selectedProductsForOrder, productDoseSelections, areaSize]);
  
  useEffect(() => {
    loadProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // This effect pre-fills the form with the logged-in user's details
    // when they are creating a new order.
    if (user && !editingOrderId) {
      setCustomerName(user.name || '');
      setCustomerEmail(user.email || '');
      setCustomerPhoneNumber(user.phone || '');
      setLocation(user.address || '');
      setAreaSize(user.areaSize || 0);
    }
  }, [user, editingOrderId, setAreaSize, setCustomerName, setCustomerEmail, setCustomerPhoneNumber, setLocation]);

  const handleOpenSelector = (category: string) => {
    setSelectorCategory(category);
    setSelectedManufacturer('');
    setSelectedProductToAdd('');
    setSelectorDialogOpen(true);
  };
  
  const handleAddProductFromSelector = () => {
    if (selectedProductToAdd) {
      ensureProductsSelected([selectedProductToAdd]);
      toast({
        title: "Product Added",
        description: `${products.find(p => p.id === selectedProductToAdd)?.name} was added to your order.`,
      });
    }
    setSelectorDialogOpen(false);
  };
  
  const availableManufacturersForDialog = useMemo(() => {
    if (!selectorCategory) return [];
    const manufacturers = new Set(
      products
        .filter(p => p.category === selectorCategory && p.manufacturer)
        .map(p => p.manufacturer!)
    );
    return Array.from(manufacturers).sort();
  }, [products, selectorCategory]);

  const availableProductsForDialog = useMemo(() => {
    if (!selectorCategory || !selectedManufacturer) return [];
    return products.filter(p => p.category === selectorCategory && p.manufacturer === selectedManufacturer);
  }, [products, selectorCategory, selectedManufacturer]);

  const filteredCategorizedTypesForDropdown = useMemo(() => {
    const userSelectedProductionTypes = user?.productionTypes || [];
    return categorizedProductionTypes
      .map(mainCat => ({
        ...mainCat,
        subcategories: mainCat.subcategories
          .map(subCat => ({
            ...subCat,
            items: subCat.items.filter(item => userSelectedProductionTypes.includes(item))
          }))
          .filter(subCat => subCat.items.length > 0)
      }))
      .filter(mainCat => mainCat.subcategories.length > 0);
  }, [categorizedProductionTypes, user]);

  // Filter for the new production type selector dialog
  const filteredProductionTypesForDialog = useMemo(() => {
    if (!productionSearchTerm) {
        return filteredCategorizedTypesForDropdown;
    }
    const lowerSearch = productionSearchTerm.toLowerCase();
    return filteredCategorizedTypesForDropdown
        .map(mainCat => ({
            ...mainCat,
            subcategories: mainCat.subcategories
                .map(subCat => ({
                    ...subCat,
                    items: subCat.items.filter(item => item.toLowerCase().includes(lowerSearch))
                }))
                .filter(subCat => subCat.items.length > 0)
        }))
        .filter(mainCat => mainCat.subcategories.length > 0);
  }, [productionSearchTerm, filteredCategorizedTypesForDropdown]);


  const filteredProducts = useMemo((): (Product & { isSelected: boolean, calculatedPackages: number, calculatedAmount?: number, calculatedAmountUnit?: string, doseSelection: 'low' | 'high' })[] => {
    let productsToFilter = products;
    const lowerSearchTerm = searchTerm.toLowerCase();

    if (selectedProductionType) {
        productsToFilter = productsToFilter.filter(p => p.suitableForProduction?.includes(selectedProductionType));
    }

    if (selectedCategory) {
        productsToFilter = productsToFilter.filter(p => p.category === selectedCategory);
    }
    
    if (searchTerm) {
        productsToFilter = productsToFilter.filter(p =>
            p.name.toLowerCase().includes(lowerSearchTerm) ||
            p.category.toLowerCase().includes(lowerSearchTerm) ||
            (p.activeIngredient && p.activeIngredient.toLowerCase().includes(lowerSearchTerm)) ||
            (p.manufacturer && p.manufacturer.toLowerCase().includes(lowerSearchTerm)) ||
            (p.notes && p.notes.toLowerCase().includes(lowerSearchTerm)) ||
            (p.suitableForProduction && p.suitableForProduction.some(sfp => sfp.toLowerCase().includes(lowerSearchTerm)))
        );
    }

    return productsToFilter.map(p => {
        const item = calculatedOrderItems.find(i => i.productId === p.id);
        return {
            ...p,
            isSelected: selectedProductsForOrder.includes(p.id),
            calculatedPackages: item ? item.calculatedPackages : 0,
            calculatedAmount: item ? item.totalAmountNeeded : undefined,
            calculatedAmountUnit: item ? item.amountUnit : undefined,
            doseSelection: productDoseSelections[p.id] || 'high',
        };
    });
  }, [products, searchTerm, selectedCategory, selectedProductionType, calculatedOrderItems, selectedProductsForOrder, productDoseSelections]);


  const availableCategories = useMemo(() => {
    const uniqueCategories = new Set(products.map(p => p.category));
    return Array.from(uniqueCategories).sort();
  }, [products]);

  const renderParsedNotes = (notesString: string | undefined) => {
    if (!notesString) return null;
    const lines = notesString.split('\n').map(line => line.trim()).filter(line => line);
    const elements: JSX.Element[] = [];
    const commonKeywords = ["Targets", "Suitable for", "Info", "Dose", "Type", "Price indication", "Related"];
    lines.forEach((line, index) => {
      let handledAsKeyValuePair = false;
      for (const keyword of commonKeywords) {
        const regex = new RegExp(`^(${keyword}):\s*(.*)`, 'i');
        const match = line.match(regex);
        if (match) {
          elements.push(<p key={`note-kv-${index}`}><strong>{match[1]}:</strong> {match[2]}</p>);
          handledAsKeyValuePair = true;
          break;
        }
      }
      if (handledAsKeyValuePair) return;
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0 && colonIndex < line.length - 1) {
        const potentialLabel = line.substring(0, colonIndex).trim();
        if (!potentialLabel.includes(' ') && potentialLabel.length < 30) {
          const value = line.substring(colonIndex + 1).trim();
          elements.push(<p key={`note-generic-kv-${index}`}><strong>{potentialLabel}:</strong> {value}</p>);
          handledAsKeyValuePair = true;
        }
      }
      if (!handledAsKeyValuePair) {
        elements.push(<p key={`note-general-${index}`}>{line}</p>);
      }
    });
    if (elements.length > 0) {
        return (
            <>
                <p className="font-semibold mt-2">Σημειώσεις:</p>
                <div className="pl-2">{elements}</div>
            </>
        );
    }
    return null;
  };

  const handleSaveOrUpdateOrder = async () => {
    if (!user) {
      toast({ title: "Authentication Required", description: "Sign in to save.", variant: "destructive" });
      return false;
    }
    const success = await saveCurrentOrder();
    return success;
  };

  const handleSendToAgronomist = async () => {
    const { staffMembers } = useAgroStore.getState();
    const selectedAgronomist = staffMembers.find(s => s.id === associatedAgronomistId);
    if (!selectedAgronomist) {
        toast({ title: "Δεν έχει επιλεγεί Γεωπόνος", description: "Παρακαλώ επιλέξτε έναν γεωπόνο από τις ρυθμίσεις σας.", variant: "destructive" });
        return;
    }
    const success = await sendOrderToAgronomist(selectedAgronomist.id, selectedAgronomist.name);
    if(success) {
        toast({ title: "Η Παραγγελία Εστάλη!", description: `Η παραγγελία σας στάλθηκε στον/ην ${selectedAgronomist.name}.` });
    } else {
        toast({ title: "Αποτυχία Αποστολής", description: "Δεν ήταν δυνατή η αποστολή της παραγγελίας. Βεβαιωθείτε ότι έχετε επιλέξει προϊόντα.", variant: "destructive" });
    }
  };


  const isActionDisabled = calculatedOrderItems.every(item => item.calculatedPackages === 0 && (item.totalAmountNeeded === undefined || item.totalAmountNeeded === 0));
  

  const finalButtonDisabledState = isActionDisabled || isSavingOrder || !user;
  const isFarmer = user?.role === 'farmer';
  const hasSelectedAgronomist = !!associatedAgronomistId;


  const handlePrintOrder = () => {
    if (isActionDisabled) {
      toast({
        title: "Αδύνατη η Εκτύπωση",
        description: "Παρακαλώ επιλέξτε προϊόντα και ορίστε το μέγεθος της έκτασης.",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Order Summary</title>');
      printWindow.document.write(`
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
          h2, h3 { color: #555; margin-top: 20px; }
          p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; margin-top: 15px; }
          .notes-section { margin-top: 20px; padding: 10px; border: 1px solid #eee; background-color: #f9f9f9; }
          .ai-recs { margin-top: 20px; padding: 10px; border: 1px dashed #BDB76B; background-color: #FFFDE7; }
          @media print {
            .no-print-in-popup { display: none; }
            button { display: none; }
          }
        </style>
      `);
      printWindow.document.write('</head><body>');
      printWindow.document.write('<h1>AgroAssist Order Summary</h1>');
      if (customerName) printWindow.document.write(`<p><strong>Customer:</strong> ${customerName}</p>`);
      if (customerEmail) printWindow.document.write(`<p><strong>Email:</strong> ${customerEmail}</p>`);
      if (customerPhoneNumber) printWindow.document.write(`<p><strong>Phone:</strong> ${customerPhoneNumber}</p>`);
      if (location) printWindow.document.write(`<p><strong>Location:</strong> ${location}</p>`);
      if (selectedProductionType) printWindow.document.write(`<p><strong>Production Type:</strong> ${selectedProductionType}</p>`);
      if (areaSize > 0) printWindow.document.write(`<p><strong>Area Size:</strong> ${areaSize} stremmata</p>`);
      if (deliveryDate) printWindow.document.write(`<p><strong>Ημερομηνία Παράδοσης:</strong> ${format(deliveryDate, "PPP", { locale: el })}</p>`);


      printWindow.document.write('<h2>Selected Products:</h2>');
      const items = calculatedOrderItems;
      if (items.length > 0) {
        printWindow.document.write('<table><thead><tr><th>Product</th><th>Quantity</th><th>Unit</th><th>Weight</th></tr></thead><tbody>');
        items.forEach(item => {
          let displayAmount = '';
          let displayUnit = '';
  
          if (item.calculatedPackages > 0) {
              displayAmount = `${item.calculatedPackages}`;
              displayUnit = item.unit || 'Τεμάχια';
          } else if (item.totalAmountNeeded && item.amountUnit) {
              let amount = item.totalAmountNeeded;
              let unit = item.amountUnit;
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
          const weightText = item.totalWeight ? `${item.totalWeight.toLocaleString()} kg` : '-';
          printWindow.document.write(`<tr><td>${item.productName}</td><td>${displayAmount}</td><td>${displayUnit}</td><td>${weightText}</td></tr>`);
        });
        printWindow.document.write('</tbody></table>');
        
        const totalPackages = items.reduce((sum, item) => sum + item.calculatedPackages, 0);
        const totalWeight = items.reduce((sum, item) => sum + (item.totalWeight || 0), 0);

        if (totalPackages > 0) {
            printWindow.document.write(`<div class="total">Total Packages/Units: ${totalPackages}</div>`);
        }
        if (totalWeight > 0) {
            printWindow.document.write(`<div class="total">Total Weight: ${totalWeight.toLocaleString()} kg</div>`);
        }
      } else {
        printWindow.document.write('<p>No products selected.</p>');
      }

      const currentAdditionalNotes = additionalOrderNotes;
      if (currentAdditionalNotes && currentAdditionalNotes.trim() !== '') {
        printWindow.document.write('<div class="notes-section"><h3>Additional Notes:</h3><pre style="white-space: pre-wrap; word-wrap: break-word;">' + currentAdditionalNotes + '</pre></div>');
      }

      const currentAiRecommendations = aiRecommendations;
      if (currentAiRecommendations.length > 0 && currentAiRecommendations[0] !== "Error fetching recommendations.") {
        printWindow.document.write('<div class="ai-recs"><h3>AI Recommendations:</h3><ul>');
        currentAiRecommendations.forEach(rec => printWindow.document.write(`<li>${rec}</li>`));
        printWindow.document.write('</ul></div>');
      }

      printWindow.document.write('<hr class="no-print-in-popup" style="margin-top: 20px;">');
      printWindow.document.write('<button class="no-print-in-popup" onclick="window.print()">Print</button> ');
      printWindow.document.write('<button class="no-print-in-popup" onclick="window.close()">Close</button>');
      printWindow.document.write('</body></html>');
      printWindow.document.close();
    } else {
      toast({
        title: "Print Error",
        description: "Could not open print window. Please check your browser's pop-up settings.",
        variant: "destructive",
      });
    }
  };

  const handleFetchRecommendations = async () => {
    if (calculatedOrderItems.every(item => item.calculatedPackages === 0)) {
       toast({
        title: "Δεν έχουν επιλεχθεί προϊόντα",
        description: "Παρακαλώ επιλέξτε μερικά προϊόντα για να λάβετε προτάσεις.",
        variant: "default",
      });
      return;
    }
    await fetchAIRecommendations();
  }

  const renderProductList = () => {
    if (isLoadingProducts) {
      return (
        <div className="flex items-center justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading products...</span>
        </div>
      );
    }
    if (productLoadingError) {
      return (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Products</AlertTitle>
          <AlertDescription>{productLoadingError}</AlertDescription>
        </Alert>
      );
    }
    if (filteredProducts.length > 0) {
      return (
        <TooltipProvider>
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead className="w-[40px] px-2"></TableHead>
                <TableHead>Προϊόν / Κατηγορία</TableHead>
                <TableHead className="w-[150px]">Δοσολογία (Ετικέτα)</TableHead>
                <TableHead className="w-[180px] text-right">Ποσότητα / Ενέργειες</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} data-state={product.isSelected ? "selected" : ""} className="align-top">
                  <TableCell className="p-2 pt-4">
                    <Checkbox
                      checked={product.isSelected}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                      aria-label={`Select ${product.name}`}
                    />
                  </TableCell>
                  <TableCell className="p-2 pt-4">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-muted-foreground">{product.category}</div>
                  </TableCell>
                  <TableCell className="p-2 pt-4 text-xs">
                    <div className="text-muted-foreground whitespace-normal">{product.dose || '-'}</div>
                  </TableCell>
                  <TableCell className="p-2 pt-4 text-right">
                    <div className="font-bold text-lg mb-1">
                      {product.isSelected ? (
                        product.calculatedPackages > 0 ? (
                          <>
                            {product.calculatedPackages}
                            <span className="text-sm font-normal text-muted-foreground"> {product.unit}</span>
                          </>
                        ) : product.calculatedAmount && product.calculatedAmountUnit ? (
                          (() => {
                            let amount = product.calculatedAmount as number;
                            let unit = product.calculatedAmountUnit as string;
                            if (unit === 'ml' && amount >= 1000) {
                              amount /= 1000;
                              unit = 'L';
                            } else if (unit === 'g' && amount >= 1000) {
                              amount /= 1000;
                              unit = 'kg';
                            }
                            return (
                              <>
                                {amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                <span className="text-sm font-normal text-muted-foreground"> {unit}</span>
                              </>
                            );
                          })()
                        ) : (
                          '-'
                        )
                      ) : (
                        '-'
                      )}
                    </div>
                    <div className="flex justify-end items-center gap-1">
                        {product.doseLow != null && product.doseHigh != null && product.doseLow !== product.doseHigh ? (
                           <Tooltip>
                            <TooltipTrigger asChild>
                               <div className="flex items-center rounded-md border p-0.5 w-fit bg-background">
                                <Button
                                  variant={product.doseSelection === 'low' ? 'secondary' : 'ghost'}
                                  className="h-full rounded-sm px-1.5 py-1 text-[10px] leading-tight"
                                  onClick={() => setProductDoseSelection(product.id, 'low')}
                                >
                                  Απλή<br/>({product.doseLow})
                                </Button>
                                <Button
                                  variant={product.doseSelection === 'high' ? 'default' : 'ghost'}
                                  className="h-full rounded-sm px-1.5 py-1 text-[10px] leading-tight"
                                  onClick={() => setProductDoseSelection(product.id, 'high')}
                                >
                                  Ενισχ.<br/>({product.doseHigh})
                                </Button>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Επιλέξτε μεταξύ απλής και ενισχυμένης δόσης.</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : null}
                         <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title={`Info for ${product.name}`}>
                              <Info className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{product.name}</DialogTitle>
                              <DialogDescription>Κατηγορία: {product.category}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-1 py-4 text-sm">
                              <p><strong>Μονάδα:</strong> {product.unit || 'N/A'}</p>
                              {product.dose && <p><strong>Δόση:</strong> {product.dose}</p>}
                              {product.activeIngredient && <p><strong>Δραστικό Συστατικό:</strong> {product.activeIngredient}</p>}
                              {product.manufacturer && <p><strong>Κατασκευαστής:</strong> {product.manufacturer}</p>}
                              {product.suitableForProduction && product.suitableForProduction.length > 0 && (
                                <p><strong>Κατάλληλο για Παραγωγή:</strong> {product.suitableForProduction.join(', ')}</p>
                              )}
                              {renderParsedNotes(product.notes)}
                            </div>
                            <DialogFooter>
                              <Button onClick={() => {
                                toggleProductSelection(product.id);
                                const closeButton = document.querySelector('[data-radix-dialog-content][aria-describedby]')?.closest('[role="dialog"]')?.querySelector('[aria-label="Close"]');
                                if(closeButton instanceof HTMLElement) closeButton.click();
                              }}
                              >
                                {product.isSelected ? "Αφαίρεση από Παραγγελία" : "Προσθήκη στην Παραγγελία"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>
      );
    }
    return (
      <div className="p-4 text-center text-muted-foreground">
        {searchTerm || selectedCategory || selectedProductionType ? 'Κανένα προϊόν δεν ταιριάζει με την αναζήτηση ή το φίλτρο σας.' : 'Πληκτρολογήστε για αναζήτηση ή φιλτράρισμα προϊόντων.'}
      </div>
    );
  };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Column 1: Inputs and Product Search/Selection */}
      <div className={cn("lg:col-span-1 space-y-6", productView === 'maximized' && "hidden")}>
        <Card className="transition-all duration-300">
          <CardHeader>
             <div className="flex justify-between items-center">
                <CardTitle>Στοιχεία Παραγγελίας</CardTitle>
                <div className="flex items-center gap-2">
                  {isDetailsCollapsed && (
                    <div className="text-sm text-muted-foreground pr-2 flex items-center gap-1.5 animate-in fade-in-0">
                      <span>{selectedProductionType || 'Παραγωγή'}</span>
                      <span className="font-bold">·</span>
                      <span>{areaSize || 0} στρ.</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDetailsCollapsed(prev => !prev)}
                    className="h-8 w-8"
                    aria-label={isDetailsCollapsed ? "Expand order details" : "Collapse order details"}
                  >
                    {isDetailsCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
          </CardHeader>
          {!isDetailsCollapsed && (
            <CardContent className="space-y-3 pt-4 animate-in fade-in-0 zoom-in-95 duration-300">
              <div>
                <Label htmlFor="customerPhoneNumber">Αριθμός Τηλεφώνου (Προαιρετικό)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customerPhoneNumber"
                    type="tel"
                    placeholder="π.χ., +302101234567"
                    value={customerPhoneNumber}
                    onChange={(e) => setCustomerPhoneNumber(e.target.value)}
                    className="mt-1 pl-10"
                  />
                </div>
              </div>
               <div>
                <Label htmlFor="customerEmail">Email Πελάτη (Προαιρετικό)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="π.χ., user@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1 pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customerName">Όνομα Πελάτη (Προαιρετικό)</Label>
                <Input
                  id="customerName"
                  placeholder="π.χ., Γιώργος Παπαδόπουλος"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="location">Τοποθεσία (Προαιρετικό)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="π.χ., Αγροτεμάχιο Α, Χωριό Χ"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 pl-10"
                  />
                </div>
              </div>
               <div>
                  <Label htmlFor="productionTypeButton">Τύπος Παραγωγής</Label>
                  <Button
                      id="productionTypeButton"
                      variant="outline"
                      className="w-full justify-start font-normal mt-1"
                      onClick={() => setIsProductionSelectorOpen(true)}
                  >
                      <span className="flex items-center">
                          <Wheat className="mr-2 h-4 w-4" />
                          {selectedProductionType || "Επιλέξτε Τύπο Παραγωγής..."}
                      </span>
                  </Button>
              </div>
              <div>
                <Label htmlFor="areaSize">Μέγεθος Έκτασης (στρέμματα)</Label>
                <Input
                  id="areaSize"
                  type="number"
                  placeholder="π.χ., 100"
                  value={areaSize || ''}
                  onChange={(e) => setAreaSize(parseFloat(e.target.value) || 0)}
                  min="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="deliveryDate">Ημερομηνία Παράδοσης (Προαιρετικό)</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal mt-1",
                                !deliveryDate && "text-muted-foreground"
                            )}
                        >
                            <Leaf className="mr-2 h-4 w-4" />
                            {deliveryDate ? format(deliveryDate, "PPP", { locale: el }) : <span>Επιλέξτε ημερομηνία</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={deliveryDate}
                            onSelect={(date) => {
                                setDeliveryDate(date);
                                setIsDetailsCollapsed(true);
                            }}
                            initialFocus
                            locale={el}
                        />
                    </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          )}
        </Card>
        
        <Card className="transition-all duration-300">
            <CardHeader>
              <div className="flex justify-between items-center">
                  <CardTitle>Γρήγορη Προσθήκη</CardTitle>
                   <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsQuickAddCollapsed(prev => !prev)}
                      className="h-8 w-8"
                      aria-label={isQuickAddCollapsed ? "Expand quick add" : "Collapse quick add"}
                    >
                      {isQuickAddCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                    </Button>
              </div>
            </CardHeader>
            {!isQuickAddCollapsed && (
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2 animate-in fade-in-0 zoom-in-95 duration-300">
                {QUICK_ADD_CATEGORIES.map(cat => {
                    const CategoryIcon = cat.icon;
                    return (
                    <Button key={cat.name} variant="outline" className="flex flex-col h-auto p-2" onClick={() => handleOpenSelector(cat.name)}>
                        <CategoryIcon className="w-6 h-6 mb-1 text-primary" />
                        <span className="text-xs">{cat.name}</span>
                    </Button>
                    )
                })}
                </CardContent>
            )}
        </Card>
        
        <Card className="transition-all duration-300">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5 text-primary" />
                  Πρόσθετες Σημειώσεις
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsNotesCollapsed(prev => !prev)}
                  className="h-8 w-8"
                  aria-label={isNotesCollapsed ? "Expand notes" : "Collapse notes"}
                >
                  {isNotesCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                </Button>
              </div>
            </CardHeader>
            {!isNotesCollapsed && (
                <CardContent className="animate-in fade-in-0 zoom-in-95 duration-300">
                    <Textarea
                        id="additionalOrderNotes"
                        placeholder="Εισάγετε τυχόν πρόσθετες σημειώσεις για την παραγγελία εδώ..."
                        value={additionalOrderNotes}
                        onChange={(e) => setAdditionalOrderNotes(e.target.value)}
                        className="min-h-[100px]"
                    />
                </CardContent>
            )}
        </Card>
        
        <Card className="transition-all duration-300">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-accent" />
                Προτάσεις από AI
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAiRecsCollapsed(prev => !prev)}
                className="h-8 w-8"
                aria-label={isAiRecsCollapsed ? "Expand AI recommendations" : "Collapse AI recommendations"}
              >
                {isAiRecsCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </Button>
            </div>
          </CardHeader>
          {!isAiRecsCollapsed && (
            <>
              <CardContent className="animate-in fade-in-0 zoom-in-95 duration-300">
                {isFetchingRecommendations ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Λήψη προτάσεων...</span>
                  </div>
                ) : aiRecommendations.length > 0 ? (
                  <ScrollArea className="h-[100px] md:h-[120px]">
                    <ul className="space-y-1 list-disc list-inside text-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                      {aiRecommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground">Δεν υπάρχουν ακόμη προτάσεις. Επιλέξτε προϊόντα και κάντε κλικ παρακάτω.</p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  onClick={handleFetchRecommendations}
                  className="w-full"
                  disabled={isFetchingRecommendations || calculatedOrderItems.every(item => item.calculatedPackages === 0)}
                >
                  {isFetchingRecommendations ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                  Λήψη Προτάσεων
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>

      {/* Column 2: Order Summary, AI Recommendations, and Product Selection List */}
      <div className={cn("lg:col-span-1 space-y-6", productView === 'maximized' && "lg:col-span-2")}>
        
        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
                <CardTitle>Επιλογή Προϊόντων</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setProductView(productView === 'maximized' ? 'default' : 'maximized')} 
                  className="h-8 w-8"
                  aria-label={productView === 'maximized' ? 'Shrink product selection' : 'Expand product selection'}
                >
                  {productView === 'maximized' ? <Shrink className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
                </Button>
              </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Αναζήτηση προϊόντων..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="shrink-0">
                    <ListFilter className="mr-2 h-4 w-4" />
                    {selectedCategory || "Φίλτρο ανά Κατηγορία"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Φίλτρο ανά Κατηγορία</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setSelectedCategory(null)}>
                    Όλες οι Κατηγορίες
                  </DropdownMenuItem>
                  {availableCategories.map((category) => (
                    <DropdownMenuItem key={category} onSelect={() => setSelectedCategory(category)}>
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="icon" onClick={() => { setSearchTerm(''); setSelectedCategory(null); setSelectedProductionType(null); }} title="Καθαρισμός Φίλτρων & Αναζήτησης">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <div className="overflow-auto h-[300px] md:h-[400px] rounded-md border">
              {renderProductList()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Σύνοψη</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] md:h-[250px]">
              <pre className="text-sm whitespace-pre-wrap break-words">{orderSummaryText}</pre>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">
            <Button
              onClick={handleSaveOrUpdateOrder}
              className="w-full"
              disabled={finalButtonDisabledState}
            >
              {isSavingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingOrderId ? <Edit3 className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />)}
              {editingOrderId ? 'Ενημέρωση' : 'Αποθήκευση'}
            </Button>
            {isFarmer && (
                <Button
                    onClick={handleSendToAgronomist}
                    disabled={!hasSelectedAgronomist || finalButtonDisabledState}
                    variant="secondary"
                    className="w-full"
                >
                    {isSavingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {!hasSelectedAgronomist ? 'Επιλέξτε Γεωπόνο στις Ρυθμίσεις' : 'Αποστολή στον Γεωπόνο'}
                </Button>
            )}
            <Button
              onClick={handlePrintOrder}
              className="w-full"
              disabled={isActionDisabled}
            >
              <Printer className="mr-2 h-4 w-4" /> Εκτύπωση
            </Button>
            <Button variant="outline" onClick={clearOrderForm} className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" /> Καθαρισμός Φόρμας
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
    
    <Dialog open={selectorDialogOpen} onOpenChange={setSelectorDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Επιλογή Προϊόντος - {selectorCategory}</DialogTitle>
                <DialogDescription>Επιλέξτε εταιρεία και μετά το προϊόν που θέλετε να προσθέσετε.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="manufacturer-selector">Εταιρεία</Label>
                    <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                        <SelectTrigger id="manufacturer-selector">
                            <SelectValue placeholder="Επιλέξτε εταιρεία..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableManufacturersForDialog.map(m => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {selectedManufacturer && (
                     <div className="space-y-2">
                         <Label htmlFor="product-selector">Προϊόν</Label>
                         <Select value={selectedProductToAdd} onValueChange={setSelectedProductToAdd}>
                             <SelectTrigger id="product-selector">
                                 <SelectValue placeholder="Επιλέξτε προϊόν..." />
                             </SelectTrigger>
                             <SelectContent>
                                 {availableProductsForDialog.map(p => (
                                     <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                 ))}
                             </SelectContent>
                         </Select>
                     </div>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setSelectorDialogOpen(false)}>Ακύρωση</Button>
                <Button onClick={handleAddProductFromSelector} disabled={!selectedProductToAdd}>Προσθήκη στην Παραγγελία</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <Dialog open={isProductionSelectorOpen} onOpenChange={setIsProductionSelectorOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Επιλογή Τύπου Παραγωγής</DialogTitle>
                <DialogDescription>Επιλέξτε μια καλλιέργεια από τις ενεργοποιημένες ρυθμίσεις σας.</DialogDescription>
            </DialogHeader>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Αναζήτηση καλλιέργειας..."
                    value={productionSearchTerm}
                    onChange={(e) => setProductionSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4 py-4">
                    {filteredProductionTypesForDialog.length > 0 ? (
                        filteredProductionTypesForDialog.map(mainCat => (
                            <div key={mainCat.category}>
                                <h3 className="text-lg font-semibold mb-3">{mainCat.category}</h3>
                                {mainCat.subcategories.map(subCat => (
                                    <div key={subCat.name} className="mb-4">
                                        <h4 className="text-md font-medium text-muted-foreground mb-2 ml-2">{subCat.name}</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            {subCat.items.map(item => (
                                                <Button
                                                    key={item}
                                                    variant={selectedProductionType === item ? "default" : "secondary"}
                                                    onClick={() => {
                                                        setSelectedProductionType(item);
                                                        setIsProductionSelectorOpen(false);
                                                        setProductionSearchTerm('');
                                                    }}
                                                >
                                                    {item}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-8">Δεν βρέθηκε καλλιέργεια που να ταιριάζει με την αναζήτησή σας.</p>
                    )}
                </div>
            </ScrollArea>
            <DialogFooter>
                 <Button variant="ghost" onClick={() => {
                    setSelectedProductionType(null);
                    setIsProductionSelectorOpen(false);
                    setProductionSearchTerm('');
                }}>Καθαρισμός Επιλογής</Button>
                <Button variant="outline" onClick={() => setIsProductionSelectorOpen(false)}>Κλείσιμο</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
