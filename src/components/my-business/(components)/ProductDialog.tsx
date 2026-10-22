
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
  DialogClose, 
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Product } from '@/lib/types';
import { useAgroStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, PlusCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from '@/components/ui/badge';

interface ProductDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product?: Product;
}

const defaultProductState: Omit<Product, 'id'> = {
  name: '',
  category: '',
  activeIngredient: '',
  manufacturer: '',
  unit: 'Packages',
  weightPerUnit: undefined,
  notes: '',
  suitableForProduction: [],
};

export function ProductDialog({ isOpen, setIsOpen, product }: ProductDialogProps) {
  const allProducts = useAgroStore(state => state.products);
  const addProduct = useAgroStore(state => state.addProduct);
  const updateProduct = useAgroStore(state => state.updateProduct);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Omit<Product, 'id'>>(defaultProductState);

  // State for dynamic comboboxes
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [availableUnits, setAvailableUnits] = useState<string[]>([]);
  const [unitSearch, setUnitSearch] = useState('');
  const [unitPopoverOpen, setUnitPopoverOpen] = useState(false);
  const [showAddUnitDialog, setShowAddUnitDialog] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  
  const [availableManufacturers, setAvailableManufacturers] = useState<string[]>([]);
  const [manufacturerSearch, setManufacturerSearch] = useState('');
  const [manufacturerPopoverOpen, setManufacturerPopoverOpen] = useState(false);
  const [showAddManufacturerDialog, setShowAddManufacturerDialog] = useState(false);
  const [newManufacturerName, setNewManufacturerName] = useState('');

  // State for "Suitable For Production" tags
  const [suitableForInputValue, setSuitableForInputValue] = useState('');
  const [suitableForOptions, setSuitableForOptions] = useState<string[]>([]);
  const [suitableForPopoverOpen, setSuitableForPopoverOpen] = useState(false);


  useEffect(() => {
    if (isOpen) {
      const cats = Array.from(new Set(allProducts.map(p => p.category))).sort();
      setAvailableCategories(cats);
      const units = Array.from(new Set(allProducts.map(p => p.unit))).sort();
      setAvailableUnits(units);
      const mfrs = Array.from(new Set(allProducts.map(p => p.manufacturer).filter(Boolean) as string[])).sort();
      setAvailableManufacturers(mfrs);
      const sfpOptions = Array.from(new Set(allProducts.flatMap(p => p.suitableForProduction || []))).sort();
      setSuitableForOptions(sfpOptions);

      if (product) {
        setFormData({
          name: product.name || '',
          category: product.category || '',
          activeIngredient: product.activeIngredient || '',
          manufacturer: product.manufacturer || '',
          unit: product.unit || 'Packages',
          weightPerUnit: product.weightPerUnit,
          notes: product.notes || '',
          suitableForProduction: product.suitableForProduction || [],
        });
      } else {
        setFormData(defaultProductState);
      }
    } else {
      // Reset form and combobox states when dialog closes
      setFormData(defaultProductState);
      setCategorySearch('');
      setUnitSearch('');
      setManufacturerSearch('');
      setSuitableForInputValue('');
    }
  }, [product, isOpen, allProducts]);
  
  useEffect(() => {
    // When adding a new product, if the unit is changed to 'Σακί',
    // and no weight has been entered yet, default it to 20.
    if (!product && formData.unit === 'Σακί' && formData.weightPerUnit === undefined) {
      setFormData(prev => ({...prev, weightPerUnit: 20}));
    }
  }, [formData.unit, formData.weightPerUnit, product]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
     if (name === 'weightPerUnit') {
      const numValue = parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? undefined : numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddNewValue = (
    value: string, 
    field: keyof Pick<Product, 'category' | 'unit' | 'manufacturer'>,
    setAvailableValues: React.Dispatch<React.SetStateAction<string[]>>,
    setShowDialog: React.Dispatch<React.SetStateAction<boolean>>,
    setNewValueName: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (value.trim()) {
      setFormData(prev => ({ ...prev, [field]: value.trim() }));
      setAvailableValues(prev => {
        const newSet = new Set([...prev, value.trim()]);
        return Array.from(newSet).sort();
      });
      setShowDialog(false);
      setNewValueName('');
    } else {
      toast({ title: "Cannot Add Empty Value", variant: "destructive" });
    }
  };

  // Specific handlers for adding new Category, Unit, Manufacturer
  const handleAddCategory = () => handleAddNewValue(newCategoryName, 'category', setAvailableCategories, setShowAddCategoryDialog, setNewCategoryName);
  const handleAddUnit = () => handleAddNewValue(newUnitName, 'unit', setAvailableUnits, setShowAddUnitDialog, setNewUnitName);
  const handleAddManufacturer = () => handleAddNewValue(newManufacturerName, 'manufacturer', setAvailableManufacturers, setShowAddManufacturerDialog, setNewManufacturerName);

  // Handlers for "Suitable For Production" tags
  const handleAddSuitableForTag = (tag: string) => {
    const newTag = tag.trim();
    if (newTag && !formData.suitableForProduction.includes(newTag)) {
      setFormData(prev => ({ ...prev, suitableForProduction: [...prev.suitableForProduction, newTag] }));
      if (!suitableForOptions.includes(newTag)) {
        setSuitableForOptions(prev => Array.from(new Set([...prev, newTag])).sort());
      }
    }
    setSuitableForInputValue('');
    setSuitableForPopoverOpen(false);
  };

  const handleRemoveSuitableForTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      suitableForProduction: prev.suitableForProduction.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleSuitableForInputChange = (value: string) => {
    setSuitableForInputValue(value);
    if (value.trim() && !suitableForPopoverOpen) {
      setSuitableForPopoverOpen(true);
    } else if (!value.trim() && suitableForPopoverOpen) {
      setSuitableForPopoverOpen(false);
    }
  };
  
  const handleSuitableForInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && suitableForInputValue.trim()) {
      e.preventDefault();
      handleAddSuitableForTag(suitableForInputValue);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.category || !formData.unit ) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields (Name, Category, Unit).",
        variant: "destructive",
      });
      return;
    }
    if (formData.weightPerUnit !== undefined && formData.weightPerUnit < 0) {
        toast({
            title: "Validation Error",
            description: "Weight cannot be negative.",
            variant: "destructive",
        });
        return;
    }


    if (product) {
      updateProduct({ ...formData, id: product.id });
      toast({ title: "Product Updated", description: `"${formData.name}" has been updated.` });
    } else {
      addProduct(formData);
      toast({ title: "Product Added", description: `"${formData.name}" has been added to the catalog.` });
    }
    setIsOpen(false);
  };

  const renderCombobox = (
    fieldLabel: string,
    fieldValue: string,
    setFieldValue: (value: string) => void,
    availableOptions: string[],
    popoverOpen: boolean,
    setPopoverOpen: (open: boolean) => void,
    searchValue: string,
    setSearchValue: (search: string) => void,
    onAddNew: () => void,
    isRequired: boolean = true
  ) => (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={fieldLabel.toLowerCase()} className="text-right">
        {fieldLabel}{isRequired ? '*' : ''}
      </Label>
      <div className="col-span-3 flex gap-2 items-center">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={popoverOpen}
              className="w-full justify-between"
            >
              {fieldValue || `Select ${fieldLabel.toLowerCase()}...`}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput
                placeholder={`Search ${fieldLabel.toLowerCase()}...`}
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>No {fieldLabel.toLowerCase()} found.</CommandEmpty>
                <CommandGroup>
                  {availableOptions
                    .filter(option => option.toLowerCase().includes(searchValue.toLowerCase()))
                    .map((option) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={(currentValue) => {
                        setFieldValue(currentValue === fieldValue ? "" : currentValue);
                        setPopoverOpen(false);
                        setSearchValue('');
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          fieldValue === option ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button type="button" variant="outline" size="icon" onClick={onAddNew} title={`Add new ${fieldLabel.toLowerCase()}`}>
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {product ? 'Update the details of this product.' : 'Fill in the details for the new product.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name*</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" />
            </div>
            
            {renderCombobox("Category", formData.category, (val) => setFormData(p => ({...p, category: val})), availableCategories, categoryPopoverOpen, setCategoryPopoverOpen, categorySearch, setCategorySearch, () => setShowAddCategoryDialog(true))}
            
            {renderCombobox("Unit", formData.unit, (val) => setFormData(p => ({...p, unit: val})), availableUnits, unitPopoverOpen, setUnitPopoverOpen, unitSearch, setUnitSearch, () => setShowAddUnitDialog(true))}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weightPerUnit" className="text-right">Weight per Unit (kg)</Label>
              <Input id="weightPerUnit" name="weightPerUnit" type="number" value={formData.weightPerUnit || ''} onChange={handleChange} className="col-span-3" placeholder="e.g., 20" min="0" step="0.1" />
            </div>

            {renderCombobox("Manufacturer", formData.manufacturer, (val) => setFormData(p => ({...p, manufacturer: val})), availableManufacturers, manufacturerPopoverOpen, setManufacturerPopoverOpen, manufacturerSearch, setManufacturerSearch, () => setShowAddManufacturerDialog(true), false)}

            {/* Suitable For Production Tags Input */}
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="suitableForProduction" className="text-right pt-2">Suitable For</Label>
                <div className="col-span-3">
                    <div className="flex flex-wrap gap-1 mb-2">
                        {formData.suitableForProduction.map(tag => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                {tag}
                                <button type="button" onClick={() => handleRemoveSuitableForTag(tag)} className="opacity-50 hover:opacity-100 focus:outline-none">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                    <Popover open={suitableForPopoverOpen} onOpenChange={setSuitableForPopoverOpen}>
                        <PopoverTrigger asChild>
                             <Input 
                                id="suitableForProduction" 
                                placeholder="Type or select production types..."
                                value={suitableForInputValue}
                                onChange={(e) => handleSuitableForInputChange(e.target.value)}
                                onKeyDown={handleSuitableForInputKeyDown}
                                onFocus={() => suitableForInputValue && setSuitableForPopoverOpen(true)}
                                className="w-full"
                            />
                        </PopoverTrigger>
                        {suitableForInputValue && suitableForOptions.filter(opt => opt.toLowerCase().includes(suitableForInputValue.toLowerCase()) && !formData.suitableForProduction.includes(opt)).length > 0 && (
                             <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandList>
                                        <CommandGroup>
                                        {suitableForOptions
                                            .filter(option => option.toLowerCase().includes(suitableForInputValue.toLowerCase()) && !formData.suitableForProduction.includes(option))
                                            .map(option => (
                                            <CommandItem
                                                key={option}
                                                value={option}
                                                onSelect={() => handleAddSuitableForTag(option)}
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
                    <p className="text-xs text-muted-foreground mt-1">Type and press Enter to add new. Select from suggestions or existing tags.</p>
                </div>
            </div>


            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="activeIngredient" className="text-right">Active Ingredient</Label>
              <Input id="activeIngredient" name="activeIngredient" value={formData.activeIngredient} onChange={handleChange} className="col-span-3" />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">Notes</Label>
              <Textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleSubmit}>Save Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Category Dialog */}
      <AlertDialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Category</AlertDialogTitle>
            <AlertDialogDescription>Enter the name for the new category.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g., Seeds, Herbicides" />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewCategoryName('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddCategory}>Add Category</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Add New Unit Dialog */}
      <AlertDialog open={showAddUnitDialog} onOpenChange={setShowAddUnitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Unit</AlertDialogTitle>
            <AlertDialogDescription>Enter the name for the new unit.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} placeholder="e.g., Liters, Kg, Packages" />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewUnitName('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddUnit}>Add Unit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add New Manufacturer Dialog */}
      <AlertDialog open={showAddManufacturerDialog} onOpenChange={setShowAddManufacturerDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Manufacturer</AlertDialogTitle>
            <AlertDialogDescription>Enter the name for the new manufacturer.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input value={newManufacturerName} onChange={(e) => setNewManufacturerName(e.target.value)} placeholder="e.g., Bayer, Syngenta" />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewManufacturerName('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddManufacturer}>Add Manufacturer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
}
