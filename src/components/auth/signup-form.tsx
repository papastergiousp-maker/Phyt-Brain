
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignupSchema, type SignupFormData } from '@/lib/schemas';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { userRoles, type UserRole } from '@/types';
import { useAgroStore } from '@/lib/store';
import { useState } from 'react';
import { Loader2, Check, ChevronsUpDown, X } from 'lucide-react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CATEGORIZED_PRODUCTION_TYPES } from '@/config/production-types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useFirebase } from '@/firebase';


export function SignupForm() {
  const { auth } = useFirebase();
  const { login } = useAgroStore.getState();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  // State for production type selector
  const [productionTypeSearch, setProductionTypeSearch] = useState('');
  const [productionPopoverOpen, setProductionPopoverOpen] = useState(false);

  const rolesForSignup = userRoles.filter(role => role.value === 'farmer' || role.value === 'agronomist');

  const form = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: undefined,
      phone: '',
      address: '',
      areaSize: undefined,
      productionTypes: [], // Initialize as empty array
      acceptTerms: false,
    },
    mode: 'onTouched'
  });
  
  const selectedProductionTypes = form.watch('productionTypes') || [];

  async function onSubmit(data: SignupFormData) {
    if (!auth) {
      toast({
        title: "Σφάλμα",
        description: "Η υπηρεσία αυθεντικοποίησης δεν είναι έτοιμη. Προσπαθήστε ξανά.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const firebaseUser = userCredential.user;

        await updateProfile(firebaseUser, { displayName: data.name });
        
        const localUser = {
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            name: data.name,
            email: data.email,
            role: data.role,
            phone: data.phone || null,
            address: data.address || null,
            areaSize: data.areaSize || 0,
            productionTypes: data.productionTypes || [],
            createdAt: new Date().toISOString(),
            roleUpgradeDate: null,
            photoURL: firebaseUser.photoURL || null,
            proLicenseCount: 0,
            grantedProFarmerIds: [],
            upgradedByAgronomistId: null,
            associatedAgronomistId: null,
        };

        // Log the user into the local store
        login(localUser);

        toast({
            title: "Ο Λογαριασμός Δημιουργήθηκε Επιτυχώς",
            description: "Καλώς ορίσατε! Ανακατευθύνεστε τώρα.",
        });
        
        router.replace('/dashboard');

    } catch (error: any) {
        let errorMessage = "An unknown error occurred during signup.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "Αυτό το email χρησιμοποιείται ήδη από άλλον λογαριασμό.";
        } else {
            console.error("Signup Auth Error:", error);
            errorMessage = "Παρουσιάστηκε ένα σφάλμα κατά την εγγραφή. Ελέγξτε τα στοιχεία σας.";
        }
        toast({
            title: "Η Δημιουργία Λογαριασμού Απέτυχε",
            description: errorMessage,
            variant: "destructive",
        });
        setIsLoading(false);
    }
  }

  const handleNextStep = async () => {
    const fieldsToValidate: (keyof SignupFormData)[] = ['email', 'name', 'password', 'confirmPassword', 'acceptTerms'];
    const isValid = await form.trigger(fieldsToValidate, { shouldFocus: true });
    if (isValid) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };
  
  const handleProductionTypeSelect = (type: string) => {
    const currentTypes = form.getValues('productionTypes') || [];
    const newTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type];
    form.setValue('productionTypes', newTypes, { shouldValidate: true });
    setProductionTypeSearch('');
  };

  const handleProductionTypeRemove = (type: string) => {
    const currentTypes = form.getValues('productionTypes') || [];
    form.setValue('productionTypes', currentTypes.filter(t => t !== type), { shouldValidate: true });
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Όνομα Επώνυμο</FormLabel>
                  <FormControl>
                    <Input placeholder="π.χ. Γιώργος Παπαδόπουλος" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Κωδικός Πρόσβασης</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Επιβεβαίωση Κωδικού</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="acceptTerms"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <label
                      htmlFor="acceptTerms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Έχω διαβάσει και αποδέχομαι ανεπιφύλακτα τους <Link href="/terms" target="_blank" className="underline hover:text-primary">Όρους Χρήσης</Link> και την <Link href="/privacy" target="_blank" className="underline hover:text-primary">Πολιτική Απορρήτου</Link>.
                    </label>
                    <FormDescription>
                      Δηλώνω ότι κατανοώ πως οι συμβουλές της AI είναι ενημερωτικές και η χρήση τους γίνεται με αποκλειστικά δική μου ευθύνη.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button type="button" onClick={handleNextStep} className="w-full">
              Επόμενο
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Είμαι</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Επιλέξτε τον ρόλο σας..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rolesForSignup.map((roleOption) => (
                        <SelectItem key={roleOption.value} value={roleOption.value}>
                          {roleOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Τηλέφωνο</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="π.χ. 2101234567" {...field} disabled={isLoading}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Διεύθυνση</FormLabel>
                  <FormControl>
                    <Input placeholder="π.χ. Αγίου Μελετίου 10, Αθήνα" {...field} disabled={isLoading}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="productionTypes"
                render={() => (
                    <FormItem>
                        <FormLabel>Κύριες Καλλιέργειες (Προαιρετικό)</FormLabel>
                         <Popover open={productionPopoverOpen} onOpenChange={setProductionPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                     <span className="truncate flex-1">
                                        {selectedProductionTypes.length > 0 
                                        ? `${selectedProductionTypes.length} καλλιέργειες επιλέχθηκαν` 
                                        : "Επιλέξτε τις κύριες καλλιέργειές σας..."}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command>
                                    <CommandInput 
                                        placeholder="Αναζήτηση καλλιέργειας..."
                                        value={productionTypeSearch}
                                        onValueChange={setProductionTypeSearch}
                                    />
                                     <CommandList>
                                        <CommandEmpty>Δεν βρέθηκε καλλιέργεια.</CommandEmpty>
                                        <ScrollArea className="h-48">
                                          {CATEGORIZED_PRODUCTION_TYPES.map(mainCat => {
                                              const filteredSubCats = mainCat.subcategories
                                                .map(subCat => ({
                                                    ...subCat,
                                                    items: subCat.items.filter(item => item.toLowerCase().includes(productionTypeSearch.toLowerCase()))
                                                }))
                                                .filter(subCat => subCat.items.length > 0);

                                              if (filteredSubCats.length === 0) return null;

                                              return (
                                                  <CommandGroup key={mainCat.category} heading={mainCat.category}>
                                                      {filteredSubCats.map(subCat => (
                                                          <div key={subCat.name} className="ml-2">
                                                              {filteredSubCats.length > 1 && <p className="text-xs text-muted-foreground px-2 py-1.5">{subCat.name}</p>}
                                                                {subCat.items.map(type => (
                                                                  <CommandItem 
                                                                      key={type} 
                                                                      onSelect={() => handleProductionTypeSelect(type)}
                                                                      value={type}
                                                                  >
                                                                    <Check
                                                                          className={cn(
                                                                          "mr-2 h-4 w-4",
                                                                          selectedProductionTypes.includes(type) ? "opacity-100" : "opacity-0"
                                                                          )}
                                                                      />
                                                                      {type}
                                                                  </CommandItem>
                                                              ))}
                                                          </div>
                                                      ))}
                                                  </CommandGroup>
                                              )
                                          })}
                                        </ScrollArea>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {selectedProductionTypes.map(type => (
                                <Badge key={type} variant="secondary">
                                    {type}
                                     <button type="button" onClick={() => handleProductionTypeRemove(type)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                        <X className="h-3 w-3" />
                                     </button>
                                </Badge>
                            ))}
                        </div>
                         <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="areaSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Συνολική Έκταση (Στρέμματα)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="π.χ. 100" {...field} disabled={isLoading}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handlePrevStep} className="w-full">
                Πίσω
              </Button>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Δημιουργία Λογαριασμού
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
