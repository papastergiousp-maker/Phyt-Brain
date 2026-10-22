
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image'; // Import NextImage
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { PlusCircle, Edit3, Trash2, ArrowUpCircle, ArrowDownCircle, Info, UploadCloud, XCircle, Search, RotateCcw } from 'lucide-react';
import { useAgroStore } from '@/lib/store';
import type { StaffMember, StaffRank } from '@/lib/types';
import { StaffDialog } from './_components/StaffDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, parseISO, isPast, differenceInDays } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Logo } from '@/components/shared/logo';


const TRIAL_PERIOD_DAYS = 5; // Define this at the top level of the module

export default function MyBusinessPage() {
  const staffMembers = useAgroStore(state => state.staffMembers);
  const promoteStaffMember = useAgroStore(state => state.promoteStaffMember);
  const demoteStaffMember = useAgroStore(state => state.demoteStaffMember);
  const deleteStaffMember = useAgroStore(state => state.deleteStaffMember);
  const companyLogoDataUri = useAgroStore(state => state.companyLogoDataUri);
  const setCompanyLogo = useAgroStore(state => state.setCompanyLogo);
  
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMember | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [staffSearchTerm, setStaffSearchTerm] = useState('');

  const filteredStaffMembers = useMemo(() => {
    if (!staffSearchTerm) {
      return staffMembers;
    }
    const lowerSearchTerm = staffSearchTerm.toLowerCase();
    return staffMembers.filter(member =>
      member.name.toLowerCase().includes(lowerSearchTerm) ||
      member.email.toLowerCase().includes(lowerSearchTerm)
    );
  }, [staffMembers, staffSearchTerm]);

  const handleAddNewStaff = () => {
    setEditingStaffMember(undefined);
    setIsDialogOpen(true);
  };

  const handleEditStaff = (staffMember: StaffMember) => {
    setEditingStaffMember(staffMember);
    setIsDialogOpen(true);
  };

  const handlePromote = (memberId: string, currentRank: StaffRank) => {
    promoteStaffMember(memberId);
  };

  const handleDemote = (memberId: string, currentRank: StaffRank) => {
    demoteStaffMember(memberId);
  };
  
  const handleDelete = (memberId: string, memberName: string) => {
    deleteStaffMember(memberId);
    toast({ title: "Το Μέλος Προσωπικού Διαγράφηκε", description: `Το μέλος ${memberName} έχει αφαιρεθεί.` });
  };

  const getTrialStatusDisplay = (member: StaffMember): string => {
    if (member.rank === 'Management' && member.trialStartDate) {
      try {
        const trialStartDate = parseISO(member.trialStartDate);
        const expiryDate = addDays(trialStartDate, TRIAL_PERIOD_DAYS); 
        const daysRemaining = differenceInDays(expiryDate, new Date());

        if (isPast(expiryDate)) {
          return `Η δοκιμή έληξε στις ${format(expiryDate, "dd MMM yyyy")}`;
        } else {
          return `Ενεργή (Λήγει: ${format(expiryDate, "dd MMM yyyy")}, ${daysRemaining} μέρες απομένουν)`;
        }
      } catch (e) {
        console.error("Error parsing trial date for display:", e);
        return "Σφάλμα στην ημερομηνία δοκιμής";
      }
    }
    return "Δ/Ι";
  };
  
  const handleLogoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Μη Έγκυρος Τύπος Αρχείου",
          description: "Παρακαλώ επιλέξτε ένα αρχείο εικόνας (π.χ., PNG, JPG, GIF).",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUri = loadEvent.target?.result as string;
        setCompanyLogo(dataUri);
        toast({
          title: "Το Λογότυπο Ενημερώθηκε",
          description: "Το λογότυπο της εταιρείας ενημερώθηκε με επιτυχία.",
        });
      };
      reader.onerror = () => {
        toast({
          title: "Η Μεταφόρτωση Απέτυχε",
          description: "Δεν ήταν δυνατή η ανάγνωση του επιλεγμένου αρχείου. Παρακαλώ προσπαθήστε ξανά.",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setCompanyLogo(null);
    toast({
      title: "Το Λογότυπο Αφαιρέθηκε",
      description: "Το λογότυπο της εταιρείας έχει αφαιρέθεί.",
    });
  };

  const isManagementPresent = staffMembers.some(m => m.rank === 'Management');


  return (
    <TooltipProvider>
    <div className="container mx-auto p-4 py-6 md:p-8 md:py-10">
        <PageHeader 
        title="Διαχείριση Προσωπικού"
        description="Διαχειριστείτε τα μέλη του προσωπικού, τους ρόλους, το λογότυπο της εταιρείας και τα επίπεδα πρόσβασης."
        >
        <Button onClick={handleAddNewStaff}>
            <PlusCircle className="mr-2 h-4 w-4" /> Προσθήκη Μέλους Προσωπικού
        </Button>
        </PageHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-2">
            <Card>
            <CardHeader className="border-b pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle>Λίστα Προσωπικού</CardTitle>
                        <CardDescription>
                            {staffMembers.length > 0 
                            ? `Έχετε ${staffMembers.length} μέλος(η) προσωπικού συνολικά.`
                            : "Δεν έχετε ακόμη μέλη προσωπικού."}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                            placeholder="Αναζήτηση προσωπικού με όνομα ή email..."
                            value={staffSearchTerm}
                            onChange={(e) => setStaffSearchTerm(e.target.value)}
                            className="pl-10"
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={() => { setStaffSearchTerm(''); }} title="Καθαρισμός Αναζήτησης">
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                {filteredStaffMembers.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Όνομα</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Βαθμίδα</TableHead>
                        <TableHead>Κατάσταση Δοκιμής</TableHead>
                        <TableHead className="text-right">Ενέργειες</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStaffMembers.map((member) => (
                        <TableRow key={member.id}>
                            <TableCell className="font-medium">{member.name}</TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>{member.rank}</TableCell>
                            <TableCell>
                            {getTrialStatusDisplay(member)}
                            {member.rank === 'Management' && member.trialStartDate && (
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="ml-2 h-3 w-3 text-muted-foreground inline-block cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs">Η δοκιμή για τη βαθμίδα Management ξεκίνησε στις {format(parseISO(member.trialStartDate), "dd MMM yyyy")}.</p>
                                    <p className="text-xs">Λήγει μετά από {TRIAL_PERIOD_DAYS} ημέρες.</p>
                                </TooltipContent>
                                </Tooltip>
                            )}
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handlePromote(member.id, member.rank)}
                                disabled={member.rank === 'Management'}
                                title="Προαγωγή"
                            >
                                <ArrowUpCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDemote(member.id, member.rank)}
                                disabled={member.rank === 'No Access'}
                                title="Υποβιβασμός"
                            >
                                <ArrowDownCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditStaff(member)} title="Επεξεργασία Μέλους">
                                <Edit3 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Διαγραφή Μέλους" className="text-destructive hover:text-destructive/90">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Αυτή η ενέργεια δεν αναιρείται. Αυτό θα διαγράψει οριστικά το μέλος {member.name}.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Ακύρωση</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(member.id, member.name)} className="bg-destructive hover:bg-destructive/90">
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
                </div>
                ) : (
                staffMembers.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Δεν βρέθηκαν μέλη προσωπικού. Προσθέστε ένα για να ξεκινήσετε!</p>
                )
                )}
                {staffMembers.length > 0 && filteredStaffMembers.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Κανένα μέλος προσωπικού δεν ταιριάζει με την αναζήτησή σας.</p>
                )}
            </CardContent>
            </Card>
        </div>
        
        <div className="md:col-span-1">
            <Card>
            <CardHeader>
                <CardTitle>Λογότυπο Εταιρείας</CardTitle>
                <CardDescription>Διαχειριστείτε το branding της εταιρείας σας.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
                <div className="w-36 h-36 rounded-md border border-dashed flex items-center justify-center bg-muted/50 overflow-hidden">
                {companyLogoDataUri ? (
                    <Image 
                    src={companyLogoDataUri} 
                    alt="Company Logo" 
                    width={144} 
                    height={144}
                    className="object-contain w-full h-full"
                    />
                ) : (
                    <Image 
                    src="https://placehold.co/150x150.png" 
                    alt="Company Logo Placeholder" 
                    width={150}
                    height={150}
                    data-ai-hint="logo placeholder"
                    className="object-contain"
                    />
                )}
                </div>
                {isManagementPresent && (
                <div className="w-full space-y-2">
                    <Input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef} 
                    id="logo-upload"
                    />
                    <Button onClick={handleLogoUploadClick} className="w-full">
                    <UploadCloud className="mr-2 h-4 w-4" /> {companyLogoDataUri ? 'Αλλαγή Λογοτύπου' : 'Μεταφόρτωση Λογοτύπου'}
                    </Button>
                    {companyLogoDataUri && (
                    <Button variant="outline" onClick={handleRemoveLogo} className="w-full">
                        <XCircle className="mr-2 h-4 w-4" /> Αφαίρεση Λογοτύπου
                    </Button>
                    )}
                </div>
                )}
                {!isManagementPresent && (
                    <p className="text-xs text-muted-foreground text-center">Η διαχείριση λογοτύπου είναι διαθέσιμη για μέλη με βαθμίδα 'Management'.</p>
                )}
            </CardContent>
            </Card>
        </div>
        </div>

        <StaffDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        staffMember={editingStaffMember}
        />
    </div>
    </TooltipProvider>
  );
}
