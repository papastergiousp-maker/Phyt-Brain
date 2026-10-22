
"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Send, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgroStore } from '@/lib/store';
import type { Client } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { sendNotificationEmail } from '@/actions/notification-actions';

interface ClientNotificationDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function ClientNotificationDialog({ isOpen, setIsOpen }: ClientNotificationDialogProps) {
  const { clients } = useAgroStore(state => ({ clients: state.clients }));
  const { toast } = useToast();

  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  
  const unselectedClients = useMemo(() => {
    const selectedIds = new Set(selectedClients.map(c => c.id));
    return clients.filter(c => !selectedIds.has(c.id));
  }, [clients, selectedClients]);
  
  const handleSelectClient = (client: Client) => {
    setSelectedClients(prev => [...prev, client]);
    setClientPopoverOpen(false);
  };
  
  const handleRemoveClient = (clientToRemove: Client) => {
    setSelectedClients(prev => prev.filter(c => c.id !== clientToRemove.id));
  };
  
  const handleSubmit = async () => {
    if (selectedClients.length === 0) {
      toast({ title: "No Recipients", description: "Please select at least one client.", variant: "destructive" });
      return;
    }
    if (!message.trim()) {
      toast({ title: "Empty Message", description: "Please write a message to send.", variant: "destructive" });
      return;
    }

    setIsSending(true);
    const result = await sendNotificationEmail({ recipients: selectedClients, message });
    setIsSending(false);

    if (result.success) {
      toast({
        title: "Ειδοποιήσεις Εστάλησαν!",
        description: `Το μήνυμά σας στάλθηκε με επιτυχία σε ${result.sentCount} πελάτη(ες).`,
      });
      // Reset form
      setSelectedClients([]);
      setMessage('');
      setIsOpen(false);
    } else {
      toast({
        title: "Η Αποστολή Απέτυχε",
        description: result.error || "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Αποστολή Ειδοποίησης σε Πελάτες</DialogTitle>
          <DialogDescription>
            Συντάξτε ένα μήνυμα και επιλέξτε τους πελάτες που θα το λάβουν μέσω email.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          
          {/* Client Selector */}
          <div className="space-y-2">
            <Label htmlFor="client-selector">Παραλήπτες</Label>
             <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="client-selector"
                        variant="outline"
                        role="combobox"
                        aria-expanded={clientPopoverOpen}
                        className="w-full justify-between"
                    >
                        Επιλογή πελατών...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Αναζήτηση πελάτη..." />
                        <CommandList>
                            <CommandEmpty>Δεν βρέθηκαν πελάτες.</CommandEmpty>
                            <CommandGroup>
                                {unselectedClients.map((client) => (
                                    <CommandItem
                                        key={client.id}
                                        value={client.name}
                                        onSelect={() => handleSelectClient(client)}
                                    >
                                        <Check className="mr-2 h-4 w-4 opacity-0" />
                                        {client.name}
                                        <span className="text-xs text-muted-foreground ml-2">{client.email}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
             {selectedClients.length > 0 && (
                <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[40px]">
                    {selectedClients.map(client => (
                        <Badge key={client.id} variant="secondary" className="flex items-center gap-1">
                            {client.name}
                            <button type="button" onClick={() => handleRemoveClient(client)} className="opacity-50 hover:opacity-100 focus:outline-none">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
          </div>

          {/* Message Textarea */}
          <div className="space-y-2">
            <Label htmlFor="message-textarea">Μήνυμα</Label>
            <Textarea
              id="message-textarea"
              placeholder="Γράψτε το μήνυμά σας εδώ..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
            />
          </div>

        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Ακύρωση</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSending}>
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
            {isSending ? 'Αποστολή...' : `Αποστολή σε ${selectedClients.length} παραλήπτες`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
