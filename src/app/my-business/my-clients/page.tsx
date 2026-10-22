
"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { PlusCircle, Edit3, Trash2, Search, RotateCcw, Send } from 'lucide-react';
import { useAgroStore } from '@/lib/store';
import type { Client } from '@/lib/types';
import { ClientDialog } from '../_components/ClientDialog';
import { ClientNotificationDialog } from '../_components/ClientNotificationDialog';
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
import { useAuth } from '@/hooks/useAuth';


export default function MyClientsPage() {
  const { clients, deleteClient } = useAgroStore(state => ({
    clients: state.clients,
    deleteClient: state.deleteClient,
  }));
  const { user } = useAuth();
  const { toast } = useToast();

  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = useMemo(() => {
    if (!searchTerm) {
      return clients;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return clients.filter(client =>
      client.name.toLowerCase().includes(lowerSearchTerm) ||
      (client.email && client.email.toLowerCase().includes(lowerSearchTerm)) ||
      (client.phone && client.phone.includes(lowerSearchTerm))
    );
  }, [clients, searchTerm]);

  const handleAddNewClient = () => {
    setEditingClient(undefined);
    setIsClientDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsClientDialogOpen(true);
  };
  
  const handleDelete = (clientId: string, clientName: string) => {
    deleteClient(clientId);
    toast({ title: "Ο Πελάτης Διαγράφηκε", description: `Ο πελάτης ${clientName} έχει αφαιρεθεί.` });
  };

  const isProfessional = user?.role === 'agronomist-premium' || user?.role === 'company';


  return (
    <div className="container mx-auto p-4 py-6 md:p-8 md:py-10">
    <PageHeader 
        title="Οι Πελάτες μου"
        description="Δείτε, προσθέστε και διαχειριστείτε τη λίστα πελατών σας."
    >
        <div className="flex gap-2">
        {isProfessional && (
            <Button onClick={() => setIsNotificationDialogOpen(true)} variant="secondary">
            <Send className="mr-2 h-4 w-4" /> Αποστολή Ειδοποίησης
            </Button>
        )}
        <Button onClick={handleAddNewClient}>
            <PlusCircle className="mr-2 h-4 w-4" /> Προσθήκη Νέου Πελάτη
        </Button>
        </div>
    </PageHeader>
    
    <Card>
        <CardHeader className="border-b pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
            <CardTitle>Λίστα Πελατών</CardTitle>
            <CardDescription>
                {clients.length > 0 
                ? `Έχετε ${clients.length} πελάτη(ες) συνολικά.`
                : "Δεν έχετε ακόμη πελάτες."}
            </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                placeholder="Αναζήτηση πελατών..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                />
            </div>
            <Button variant="outline" size="icon" onClick={() => setSearchTerm('')} title="Καθαρισμός Αναζήτησης">
                <RotateCcw className="h-4 w-4" />
            </Button>
            </div>
        </div>
        </CardHeader>
        <CardContent className="pt-4">
        {filteredClients.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Όνομα</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Τηλέφωνο</TableHead>
                    <TableHead className="text-right">Ενέργειες</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClient(client)} title="Επεξεργασία Πελάτη">
                        <Edit3 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Διαγραφή Πελάτη" className="text-destructive hover:text-destructive/90">
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
                            <AlertDialogDescription>
                                Αυτή η ενέργεια δεν αναιρείται. Αυτό θα διαγράψει οριστικά τον πελάτη {client.name}.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Ακύρωση</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(client.id, client.name)} className="bg-destructive hover:bg-destructive/90">
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
            <p className="text-center text-muted-foreground py-8">
            {searchTerm ? 'Κανένας πελάτης δεν ταιριάζει με την αναζήτησή σας.' : 'Δεν βρέθηκαν πελάτες. Προσθέστε έναν για να ξεκινήσετε!'}
            </p>
        )}
        </CardContent>
    </Card>
    
    <ClientDialog
        isOpen={isClientDialogOpen}
        setIsOpen={setIsClientDialogOpen}
        client={editingClient}
    />
    <ClientNotificationDialog
        isOpen={isNotificationDialogOpen}
        setIsOpen={setIsNotificationDialogOpen}
    />
    </div>
  );
}
