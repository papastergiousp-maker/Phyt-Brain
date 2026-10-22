
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAgroStore, type User } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ShieldAlert, Trash2, UserCircle, Wheat, Briefcase, Check, ChevronsUpDown, X, Search, Grape, TreePine, Carrot, Camera as CameraIcon, Ticket, Crown, Sparkles, AlertTriangle, XCircle, FileDown, FileUp, LogOut } from 'lucide-react';
import { ChangePasswordSchema, type ChangePasswordFormData, ProfileUpdateSchema, type ProfileUpdateFormData } from '@/lib/schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { userRoles, type UserRole } from '@/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { LucideIcon } from 'lucide-react';
import type { ProductionTypeCategory } from '@/config/production-types';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { redeemPromoCode, type RedeemPromoCodeResponse } from '@/actions/promo-code-actions';
import { differenceInDays, addMonths, parseISO, format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { updatePassword } from 'firebase/auth';


const categoryIcons: Record<string, LucideIcon> = {
    '🌾 Μεγάλες Καλλιέργειες': Wheat,
    '🌳 Δέντρα & Θάμνοι': TreePine,
    '🍇 Κηπευτικά & Αμπέλι': Grape,
    '🌿 Ειδικές & Κτηνοτροφικές': Carrot,
};

const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (loadEvent) => {
      const img = new window.Image();
      img.src = loadEvent.target?.result as string;
      img.onload = () => {
        let { width, height } = img;

        if (width <= maxWidth && height <= maxHeight) {
            resolve(img.src);
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
        if (!ctx) return reject(new Error('Could not get canvas context.'));
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

function SubscriptionStatusCard({ user }: { user: User }) {
  const isUpgraded = user.role === 'farmer-pro' || user.role === 'agronomist-premium';
  
  if (!isUpgraded || !user.roleUpgradeDate) {
    return null;
  }

  const upgradeDate = parseISO(user.roleUpgradeDate);
  const expiryDate = addMonths(upgradeDate, 1);
  const daysRemaining = differenceInDays(expiryDate, new Date());
  
  const isExpired = daysRemaining < 0;
  const cardBorderColor = isExpired ? 'border-red-500/50' : (daysRemaining < 7 ? 'border-yellow-500/50' : 'border-primary/30');
  
  return (
    <Card className={cn('shadow-lg', cardBorderColor)}>
      <CardHeader>
        <CardTitle className="font-headline flex items-center">
            <Sparkles className="mr-2 h-6 w-6 text-yellow-500" />
            Κατάσταση Συνδρομής
        </CardTitle>
        <CardDescription>
            {isExpired ? 'Η premium συνδρομή σας έχει λήξει.' : 'Το premium πακέτο σας είναι ενεργό.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isExpired ? (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Η συνδρομή έληξε!</AlertTitle>
                <AlertDescription>
                    Η premium πρόσβασή σας έληξε στις {format(expiryDate, 'dd/MM/yyyy')}. Παρακαλώ ανανεώστε.
                </AlertDescription>
             </Alert>
        ) : (
            <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Απομένουν</p>
                <p className="text-4xl font-bold">{daysRemaining}</p>
                <p className="text-sm text-muted-foreground">ημέρες</p>
                <p className="text-xs text-muted-foreground mt-1">Λήξη στις: {format(expiryDate, 'dd/MM/yyyy')}</p>
            </div>
        )}
      </CardContent>
      <CardFooter>
          <Button asChild className="w-full">
            <Link href="/pricing">
                {isExpired ? 'Ανανέωση Συνδρομής' : 'Διαχείριση Συνδρομής'}
            </Link>
          </Button>
      </CardFooter>
    </Card>
  );
}


function SettingsForm() {
  const { auth } = useAuth();
  const user = useAgroStore(state => state.user);
  const { toast } = useToast();
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const {
    updateUserProfile,
    categorizedProductionTypes,
    staffMembers,
    setAssociatedAgronomist,
    updateUserRole, // Get this action
    redeemLocalPromoCode,
    logout,
    exportState,
    importState,
  } = useAgroStore();
  
  const associatedAgronomistId = useAgroStore(state => state.user?.associatedAgronomistId);

  const [agronomistPopoverOpen, setAgronomistPopoverOpen] = useState(false);
  const [agronomistSearch, setAgronomistSearch] = useState('');
  
  const [isProductionSelectorOpen, setIsProductionSelectorOpen] = useState(false);
  const [productionSearchTerm, setProductionSearchTerm] = useState('');
  
  const [tempSelectedAgronomist, setTempSelectedAgronomist] = useState<string | null>(null);

  // States for promo code redemption
  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const profileForm = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(ProfileUpdateSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      areaSize: 0,
      role: 'farmer',
      productionTypes: [],
      photoURL: '',
    },
  });
  
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        areaSize: user.areaSize || 0,
        role: user.role || 'farmer',
        productionTypes: user.productionTypes || [],
        photoURL: user.photoURL || '',
      });
      setTempSelectedAgronomist(associatedAgronomistId || null);
    }
  }, [user, profileForm, associatedAgronomistId]);


  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const handlePasswordSubmit = async (data: ChangePasswordFormData) => {
    setIsSavingPassword(true);
    if (!auth?.currentUser) {
        toast({ title: 'Σφάλμα', description: 'Δεν βρέθηκε συνδεδεμένος χρήστης.', variant: 'destructive' });
        setIsSavingPassword(false);
        return;
    }
    try {
        await updatePassword(auth.currentUser, data.newPassword);
        toast({
            title: 'Επιτυχία',
            description: 'Ο κωδικός πρόσβασής σας άλλαξε με επιτυχία.',
        });
        passwordForm.reset();
    } catch (error: any) {
        console.error('Password change error:', error);
        let message = 'Παρουσιάστηκε ένα σφάλμα.';
        if (error.code === 'auth/requires-recent-login') {
            message = 'Αυτή η ενέργεια απαιτεί πρόσφατη σύνδεση. Παρακαλώ αποσυνδεθείτε και συνδεθείτε ξανά.';
        } else if (error.code === 'auth/weak-password') {
            message = 'Ο νέος κωδικός είναι πολύ αδύναμος.';
        }
        toast({
            title: 'Αποτυχία Αλλαγής Κωδικού',
            description: message,
            variant: 'destructive',
        });
    } finally {
        setIsSavingPassword(false);
    }
  };
  
  const handleProfileSubmit = (data: ProfileUpdateFormData) => {
    if (!user) return;
    setIsSavingProfile(true);
    
    const areaSizeAsNumber = Number(data.areaSize) || 0;
    
    updateUserProfile(user.id, {
      ...data,
      areaSize: areaSizeAsNumber
    });

    setTimeout(() => {
       toast({
        title: 'Το Προφίλ Ενημερώθηκε',
        description: 'Οι αλλαγές στο προφίλ σας αποθηκεύτηκαν με επιτυχία.',
      });
      setIsSavingProfile(false);
    }, 1000);
  };

  const handleRedeemPromoCode = async () => {
    if (!promoCode.trim()) {
        toast({ title: "Please enter a promo code.", variant: "destructive" });
        return;
    }
    if (!user) {
        toast({ title: "You must be logged in.", variant: "destructive" });
        return;
    }
    setIsRedeeming(true);

    // Call server action first
    const serverResult = await redeemPromoCode(promoCode, user.id, user.email, user.role);

    if (serverResult.success && serverResult.newRole) {
        // Then update client-side state
        const localResult = redeemLocalPromoCode(promoCode, user.id, user.email);

        if (localResult.success) {
            updateUserRole(user.id, serverResult.newRole, serverResult.upgradeDate);
            toast({
                title: "Code Redeemed!",
                description: `Your account has been upgraded to ${serverResult.newRole.replace('-', ' ')}.`,
            });
            setPromoCode('');
        } else {
            toast({
                title: "Redemption Failed",
                description: localResult.error || "An unknown error occurred on the client.",
                variant: "destructive",
            });
        }
    } else {
        toast({
            title: "Redemption Failed",
            description: serverResult.error || "An unknown server error occurred.",
            variant: "destructive",
        });
    }

    setIsRedeeming(false);
  };


  const handleDeleteAccount = () => {
     logout();
     // In a real app, also delete from Firebase Auth and DB
     toast({
        title: 'Ο Λογαριασμός Διαγράφηκε',
        description: 'Ο λογαριασμός σας έχει διαγραφεί (προσομοίωση).',
        variant: 'default',
      });
  }

  const handlePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const resizedDataUrl = await resizeImage(file, 200, 200);
        profileForm.setValue('photoURL', resizedDataUrl, { shouldDirty: true, shouldValidate: true });
        toast({ title: 'Η εικόνα ενημερώθηκε', description: 'Πατήστε "Αποθήκευση Αλλαγών" για να οριστικοποιήσετε.' });
      } catch (error) {
        toast({ title: 'Σφάλμα Εικόνας', description: 'Δεν ήταν δυνατή η επεξεργασία της εικόνας.', variant: 'destructive' });
      }
    }
  };

  const handleRemovePicture = () => {
    profileForm.setValue('photoURL', '', { shouldDirty: true, shouldValidate: true });
    toast({ title: 'Η εικόνα αφαιρέθηκε', description: 'Πατήστε "Αποθήκευση Αλλαγών" για να οριστικοποιήσετε.' });
  };

  const getInitials = (name?: string) => {
    if (!name) return '...';
    const names = name.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };


  const availableAgronomists = useMemo(() => {
    return staffMembers
      .filter(u => u.rank === 'Management' || u.rank === 'Staff')
      .map(agronomist => {
        return {
          id: agronomist.id,
          name: agronomist.name,
          email: agronomist.email,
        };
      });
  }, [staffMembers]);
  
  const handleConfirmAgronomist = () => {
    if (!user || user.role !== 'farmer') return;

    const newAgronomistId = tempSelectedAgronomist;
    setAssociatedAgronomist(newAgronomistId, user.id);
    
    if (newAgronomistId) {
        const agronomist = availableAgronomists.find(a => a.id === newAgronomistId);
        toast({
            title: 'Ο Γεωπόνος Ενημερώθηκε!',
            description: `Συνδεθήκατε με τον γεωπόνο ${agronomist?.name}.`,
        });
    } else {
        toast({
            title: 'Αποσυνδεθήκατε',
            description: 'Έχετε αποσυνδεθεί από τον γεωπόνο σας.',
        });
    }
  };

  const handleExport = () => {
    const stateString = exportState();
    const blob = new Blob([stateString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phyt_ai_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Εξαγωγή Ολοκληρώθηκε', description: 'Το αρχείο backup σας έχει ληφθεί.' });
  };

  const handleImportClick = () => {
    importFileRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') throw new Error('Could not read file.');
        importState(result);
        toast({ title: 'Εισαγωγή Επιτυχής!', description: 'Τα δεδομένα σας έχουν αποκατασταθεί. Η σελίδα θα ανανεωθεί.' });
        setTimeout(() => window.location.reload(), 1500);
      } catch (error: any) {
        toast({ title: 'Σφάλμα Εισαγωγής', description: error.message || 'Invalid file format.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    
    // Reset file input to allow re-uploading the same file
    if(event.target) event.target.value = "";
  };


  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Φόρτωση ρυθμίσεων...</p>
      </div>
    );
  }

  const isAdmin = user.email.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase();
  const isFarmer = user?.role === 'farmer' || user?.role === 'farmer-pro';
  const isAgronomist = user?.role === 'agronomist' || user?.role === 'agronomist-premium' || user?.role === 'agronomist-trial';
  const rolesForProfileUpdate = userRoles.filter(role => role.value === 'farmer' || role.value === 'agronomist');
  const selectedProductionTypes = profileForm.watch('productionTypes') || [];
  const currentPhotoURL = profileForm.watch('photoURL');
  
  const handleProductionTypeToggle = (type: string) => {
    const currentTypes = profileForm.getValues('productionTypes') || [];
    const newTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type];
    profileForm.setValue('productionTypes', newTypes, { shouldValidate: true });
  };
  
  const filteredProductionTypesForDialog = useMemo(() => {
    if (!productionSearchTerm) {
        return categorizedProductionTypes;
    }
    const lowerSearch = productionSearchTerm.toLowerCase();
    return categorizedProductionTypes
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
  }, [productionSearchTerm, categorizedProductionTypes]);

  const usedLicenses = user.grantedProFarmerIds?.length || 0;
  const totalLicenses = user.proLicenseCount || 0;

  return (
    <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
      <div className="space-y-8">
        <Card className="shadow-lg">
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
              <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={currentPhotoURL || undefined} alt={user.name} />
                            <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              type="button" 
                              size="icon" 
                              className="h-7 w-7 rounded-full z-10"
                              onClick={() => fileInputRef.current?.click()}
                            >
                               <CameraIcon className="h-4 w-4" />
                            </Button>
                            {currentPhotoURL && (
                               <Button 
                                type="button" 
                                size="icon" 
                                variant="destructive"
                                className="h-7 w-7 rounded-full z-10 -ml-2"
                                onClick={handleRemovePicture}
                              >
                                 <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handlePictureUpload}
                          accept="image/png, image/jpeg, image/gif"
                          className="hidden"
                        />
                    </div>
                    <div>
                        <CardTitle className="font-headline flex items-center">
                          <UserCircle className="mr-2 h-6 w-6 text-primary" />
                          Προφίλ Χρήστη
                        </CardTitle>
                        <CardDescription>Επεξεργαστείτε τις πληροφορίες του λογαριασμού σας.</CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                 <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Όνομα</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isSavingProfile} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div>
                    <FormLabel>Email</FormLabel>
                    <Input value={user.email} readOnly disabled className="mt-1 bg-muted/50" />
                 </div>
                 <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Τηλέφωνο</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isSavingProfile} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={profileForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Διεύθυνση</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isSavingProfile} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={profileForm.control}
                  name="areaSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Έκταση (Στρέμματα)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} disabled={isSavingProfile} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ρόλος</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isSavingProfile || user.role === 'farmer-pro' || user.role === 'agronomist-premium'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Επιλέξτε τον ρόλο σας..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rolesForProfileUpdate.map((roleOption) => (
                            <SelectItem key={roleOption.value} value={roleOption.value}>
                              {roleOption.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(user.role === 'farmer-pro' || user.role === 'agronomist-premium') && (
                        <p className='text-xs text-muted-foreground mt-1'>Cannot change role after upgrading with a promo code.</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="productionTypes"
                  render={() => (
                      <FormItem>
                          <FormLabel>Κύριες Καλλιέργειες</FormLabel>
                          <Dialog open={isProductionSelectorOpen} onOpenChange={setIsProductionSelectorOpen}>
                              <DialogTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                                      <span className="truncate flex-1">
                                          {selectedProductionTypes.length > 0 
                                              ? `${selectedProductionTypes.length} καλλιέργειες επιλέχθηκαν` 
                                              : "Επιλέξτε τις καλλιέργειές σας..."}
                                      </span>
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
                                  <DialogHeader>
                                      <DialogTitle>Επιλέξτε τις Καλλιέργειές σας</DialogTitle>
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
                                              filteredProductionTypesForDialog.map((mainCat: ProductionTypeCategory) => {
                                                  const CategoryIcon = categoryIcons[mainCat.category] || Wheat;
                                                  return (
                                                      <div key={mainCat.category}>
                                                          <h3 className="text-lg font-semibold mb-3 flex items-center"><CategoryIcon className="w-5 h-5 mr-2 text-primary" />{mainCat.category}</h3>
                                                          {mainCat.subcategories.map(subCat => (
                                                              <div key={subCat.name} className="mb-4">
                                                                  <h4 className="text-md font-medium text-muted-foreground mb-2 ml-2">{subCat.name}</h4>
                                                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                                      {subCat.items.map(item => (
                                                                          <Button
                                                                              key={item}
                                                                              variant={selectedProductionTypes.includes(item) ? "default" : "secondary"}
                                                                              onClick={() => handleProductionTypeToggle(item)}
                                                                              className="justify-start text-left h-auto"
                                                                          >
                                                                              <Check className={cn("mr-2 h-4 w-4", selectedProductionTypes.includes(item) ? "opacity-100" : "opacity-0")} />
                                                                              {item}
                                                                          </Button>
                                                                      ))}
                                                                  </div>
                                                              </div>
                                                          ))}
                                                      </div>
                                                  );
                                              })
                                          ) : (
                                              <p className="text-center text-muted-foreground py-8">Δεν βρέθηκε καλλιέργεια που να ταιριάζει με την αναζήτησή σας.</p>
                                          )}
                                      </div>
                                  </ScrollArea>
                                  <DialogFooter>
                                      <Button onClick={() => setIsProductionSelectorOpen(false)}>Επιβεβαίωση</Button>
                                  </DialogFooter>
                              </DialogContent>
                          </Dialog>
                          <div className="flex flex-wrap gap-1 mt-2 min-h-[24px]">
                              {selectedProductionTypes.map(type => (
                                  <Badge key={type} variant="secondary">
                                      {type}
                                      <button type="button" onClick={() => handleProductionTypeToggle(type)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                          <X className="h-3 w-3" />
                                      </button>
                                  </Badge>
                              ))}
                          </div>
                          <FormMessage />
                      </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSavingProfile} className="w-full">
                  {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Αποθήκευση Αλλαγών
                </Button>
              </CardContent>
            </form>
          </Form>
        </Card>
        <SubscriptionStatusCard user={user} />
      </div>
      
      <div className="space-y-8">
        {(isFarmer) && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline flex items-center">
                  <Briefcase className="mr-2 h-6 w-6 text-primary" />
                  Ο Γεωπόνος μου
                </CardTitle>
                <CardDescription>Επιλέξτε ή αλλάξτε τον προεπιλεγμένο γεωπόνο για τα αιτήματά σας.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableAgronomists.length > 0 ? (
                  <>
                    <Popover open={agronomistPopoverOpen} onOpenChange={setAgronomistPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={agronomistPopoverOpen}
                                className="w-full justify-between"
                            >
                                {tempSelectedAgronomist
                                    ? availableAgronomists.find(a => a.id === tempSelectedAgronomist)?.name
                                    : "Επιλέξτε έναν γεωπόνο..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput
                                    placeholder="Αναζήτηση με όνομα, email, τηλ..."
                                    value={agronomistSearch}
                                    onValueChange={setAgronomistSearch}
                                />
                                <CommandList>
                                    <CommandEmpty>Δεν βρέθηκε γεωπόνος.</CommandEmpty>
                                    <CommandGroup>
                                        {availableAgronomists
                                            .filter(a => {
                                                const searchTerm = agronomistSearch.toLowerCase();
                                                if (!searchTerm) return true;
                                                return (
                                                  a.name.toLowerCase().includes(searchTerm) ||
                                                  a.email.toLowerCase().includes(searchTerm)
                                                );
                                            })
                                            .map(agronomist => (
                                                <CommandItem
                                                    key={agronomist.id}
                                                    value={agronomist.name}
                                                    onSelect={() => {
                                                        setTempSelectedAgronomist(agronomist.id === tempSelectedAgronomist ? null : agronomist.id);
                                                        setAgronomistPopoverOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            tempSelectedAgronomist === agronomist.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {agronomist.name}
                                                </CommandItem>
                                            ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {tempSelectedAgronomist !== associatedAgronomistId && (
                       <Button
                        onClick={handleConfirmAgronomist}
                        className="w-full"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Επιβεβαίωση Σύνδεσης
                      </Button>
                    )}
                     {associatedAgronomistId && tempSelectedAgronomist === associatedAgronomistId && (
                      <p className="text-xs text-muted-foreground p-2 text-center rounded-md bg-muted">
                          Είστε ήδη συνδεδεμένοι με τον/την {availableAgronomists.find(a => a.id === associatedAgronomistId)?.name}.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Δεν υπάρχουν διαθέσιμοι γεωπόνοι αυτή τη στιγμή.</p>
                )}
              </CardContent>
            </Card>
        )}
        
        {isAgronomist && (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center">
                        <Crown className="mr-2 h-6 w-6 text-yellow-500" />
                        Άδειες Pro Αγροτών
                    </CardTitle>
                    <CardDescription>Διαχειριστείτε τις Pro συνδρομές που μπορείτε να παρέχετε στους συνδεδεμένους αγρότες σας.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Διαθέσιμες Άδειες</p>
                        <p className="text-3xl font-bold">{totalLicenses - usedLicenses} / {totalLicenses}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">Όταν ένας αγρότης συνδέεται μαζί σας, του παραχωρείται αυτόματα μια Pro άδεια, εφόσον υπάρχουν διαθέσιμες.</p>
                </CardContent>
            </Card>
        )}

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center">
                    <Ticket className="mr-2 h-6 w-6 text-primary"/>
                    Redeem Promo Code
                </CardTitle>
                <CardDescription>Enter a promo code to upgrade your account.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Input
                        placeholder="Enter your code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        disabled={isRedeeming}
                    />
                    <Button onClick={handleRedeemPromoCode} disabled={isRedeeming || !promoCode}>
                        {isRedeeming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Redeem
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center">
                    <ShieldAlert className="mr-2 h-6 w-6 text-primary" />
                    Ασφάλεια & Δεδομένα
                </CardTitle>
                <CardDescription>Αλλάξτε τον κωδικό πρόσβασής σας και διαχειριστείτε τα δεδομένα της εφαρμογής.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4 rounded-lg border p-4">
                        <h4 className="font-medium">Αλλαγή Κωδικού</h4>
                        <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Τρέχων Κωδικός Πρόσβασης</FormLabel>
                                <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Νέος Κωδικός Πρόσβασης</FormLabel>
                                <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={passwordForm.control}
                            name="confirmNewPassword"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Επιβεβαίωση Νέου Κωδικού</FormLabel>
                                <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isSavingPassword}>
                            {isSavingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Αλλαγή Κωδικού
                        </Button>
                    </form>
                </Form>
                 <div className="space-y-2 rounded-lg border p-4">
                    <h4 className="font-medium">Διαχείριση Δεδομένων</h4>
                    <p className="text-sm text-muted-foreground">Εξάγετε όλα τα δεδομένα σας (παραγγελίες, πελάτες, ρυθμίσεις) σε ένα αρχείο JSON για backup ή για μεταφορά σε άλλη συσκευή.</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="secondary" className="w-full" onClick={handleExport}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Εξαγωγή Δεδομένων
                        </Button>
                         <Button variant="secondary" className="w-full" onClick={handleImportClick}>
                            <FileUp className="mr-2 h-4 w-4" />
                            Εισαγωγή Δεδομένων
                        </Button>
                        <input type="file" ref={importFileRef} onChange={handleImportFile} accept=".json" className="hidden" />
                    </div>
                </div>
                <div className="space-y-2 rounded-lg border border-destructive/50 p-4">
                    <h4 className="font-medium text-destructive">Επικίνδυνη Ζώνη</h4>
                     <Button variant="destructive" className="w-full" onClick={handleDeleteAccount}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Διαγραφή Λογαριασμού
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { loading } = useAuth();
  
  if (loading) {
     return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }

  return (
    <div className='container mx-auto p-4 py-6 md:p-8 md:py-10'>
        <PageHeader
            title="Ρυθμίσεις Λογαριασμού"
            description="Διαχειριστείτε τις πληροφορίες του προφίλ σας και τις ρυθμίσεις ασφαλείας."
        />
        <SettingsForm />
    </div>
  );
}
