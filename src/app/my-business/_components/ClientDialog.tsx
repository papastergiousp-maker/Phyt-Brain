
"use client";

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Client } from '@/lib/types';
import { useAgroStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, PlusCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from '@/components/ui/badge';

interface ClientDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  client?: Client;
}

const defaultClientState: Omit<Client, 'id'> = {
  name: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
  areaSize: undefined,
  productionTypes: [],
};

export function ClientDialog({ isOpen, setIsOpen, client }: ClientDialogProps) {
  const { allAvailableProductionTypes, addClient, updateClient } = useAgroStore(state => ({
    allAvailableProductionTypes: state.allAvailableProductionTypes,
    addClient: state.addClient,
    updateClient: state.updateClient,
  }));
  const { toast } = useToast();

  const [formData, setFormData] = useState<Omit<Client, 'id'>>(defaultClientState);
  
  const [productionInputValue, setProductionInputValue] = useState('');
  const [productionPopoverOpen, setProductionPopoverOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        notes: client.notes || '',
        areaSize: client.areaSize,
        productionTypes: client.productionTypes || [],
      });
    } else {
      setFormData(defaultClientState);
    }
  }, [client, isOpen]);
  
  useEffect(() => {
      if (productionInputValue.trim()) {
        const lowercasedInput = productionInputValue.toLowerCase();
        setFilteredOptions(allAvailableProductionTypes.filter(opt => opt.toLowerCase().includes(lowercasedInput) && !formData.productionTypes?.includes(opt)));
      } else {
        setFilteredOptions([]);
      }
  }, [productionInputValue, allAvailableProductionTypes, formData.productionTypes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'areaSize') {
        const numValue = parseFloat(value);
        setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? undefined : numValue }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddProductionType = (type: string) => {
    const newType = type.trim();
    if (newType && !formData.productionTypes?.includes(newType)) {
      setFormData(prev => ({ ...prev, productionTypes: [...(prev.productionTypes || []), newType] }));
    }
    setProductionInputValue('');
    setProductionPopoverOpen(false);
  };

  const handleRemoveProductionType = (typeToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      productionTypes: prev.productionTypes?.filter(type => type !== typeToRemove),
    }));
  };

  const handleProductionInputChange = (value: string) => {
    setProductionInputValue(value);
    if (value.trim() && !productionPopoverOpen) {
      setProductionPopoverOpen(true);
    } else if (!value.trim() && productionPopoverOpen) {
      setProductionPopoverOpen(false);
    }
  };
  
  const handleProductionInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && productionInputValue.trim()) {
      e.preventDefault();
      handleAddProductionType(productionInputValue);
    }
  };


  const handleSubmit = () => {
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Please fill in the client's name.",
        variant: "destructive",
      });
      return;
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        toast({
            title: "Validation Error",
            description: "Please enter a valid email address.",
            variant: "destructive",
        });
        return;
    }


    if (client) {
      updateClient({ ...formData, id: client.id });
      toast({ title: "Client Updated", description: `"${formData.name}" has been updated.` });
    } else {
      addClient(formData);
      toast({ title: "Client Added", description: `"${formData.name}" has been added.` });
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            {client ? 'Update the details of this client.' : 'Fill in the details for the new client.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name*</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">Phone</Label>
            <Input id="phone" name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">Address</Label>
            <Input id="address" name="address" value={formData.address || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="areaSize" className="text-right">Area (stremma)</Label>
            <Input id="areaSize" name="areaSize" type="number" value={formData.areaSize || ''} onChange={handleChange} className="col-span-3" />
          </div>
          
           {/* Production Types Tags Input */}
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="productionTypes" className="text-right pt-2">Production</Label>
                <div className="col-span-3">
                    <div className="flex flex-wrap gap-1 mb-2">
                        {formData.productionTypes?.map(type => (
                            <Badge key={type} variant="secondary" className="flex items-center gap-1">
                                {type}
                                <button type="button" onClick={() => handleRemoveProductionType(type)} className="opacity-50 hover:opacity-100 focus:outline-none">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                    <Popover open={productionPopoverOpen} onOpenChange={setProductionPopoverOpen}>
                        <PopoverTrigger asChild>
                             <Input 
                                id="productionTypes" 
                                placeholder="Type or select production types..."
                                value={productionInputValue}
                                onChange={(e) => handleProductionInputChange(e.target.value)}
                                onKeyDown={handleProductionInputKeyDown}
                                onFocus={() => setProductionPopoverOpen(true)}
                                className="w-full"
                            />
                        </PopoverTrigger>
                        {productionInputValue && filteredOptions.length > 0 && (
                             <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandList>
                                        <CommandGroup>
                                        {filteredOptions
                                            .map(option => (
                                            <CommandItem
                                                key={option}
                                                value={option}
                                                onSelect={() => handleAddProductionType(option)}
                                            >
                                                {option}
                                            </CommandItem>
                                        ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        )}
                    </Popover>
                    <p className="text-xs text-muted-foreground mt-1">Type and press Enter to add new. Select from suggestions.</p>
                </div>
            </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right pt-2">Notes</Label>
            <Textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit}>Save Client</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
