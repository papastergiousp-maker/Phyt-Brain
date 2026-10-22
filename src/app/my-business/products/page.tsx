
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { PlusCircle, Edit3, Trash2, Search, ListFilter, RotateCcw, Wheat, Building, Loader2, AlertCircle } from 'lucide-react';
import { useAgroStore } from '@/lib/store';
import type { Product } from '@/lib/types';
import { ProductDialog } from '../_components/ProductDialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


export default function ProductsPage() {
  const { products: allProducts, loadProducts, isLoadingProducts, productLoadingError } = useAgroStore();

  // Note: Local product management (add/edit/delete) is now deprecated,
  // as the single source of truth is the catalog-data.ts file.
  // These dialogs can be used for viewing details, or adapted if needed.
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProductionType, setSelectedProductionType] = useState<string | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);
  
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleAddNewProduct = () => {
    setEditingProduct(undefined);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const availableCategories = useMemo(() => {
    const uniqueCategories = new Set(allProducts.map(p => p.category));
    return Array.from(uniqueCategories).sort();
  }, [allProducts]);

  const availableProductionTypes = useMemo(() => {
    const uniqueProductionTypes = new Set<string>();
    allProducts.forEach(p => {
      if (p.suitableForProduction) {
        p.suitableForProduction.forEach(type => uniqueProductionTypes.add(type));
      }
    });
    return Array.from(uniqueProductionTypes).sort();
  }, [allProducts]);

  const availableManufacturers = useMemo(() => {
    const uniqueManufacturers = new Set(allProducts.map(p => p.manufacturer).filter(Boolean) as string[]);
    return Array.from(uniqueManufacturers).sort();
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    let productsToFilter = allProducts;
    const lowerSearchTerm = searchTerm.toLowerCase();

    if (selectedProductionType) {
      productsToFilter = productsToFilter.filter(p =>
        p.suitableForProduction && p.suitableForProduction.includes(selectedProductionType)
      );
    }
    
    if (selectedManufacturer) {
      productsToFilter = productsToFilter.filter(p => p.manufacturer === selectedManufacturer);
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
    return productsToFilter;
  }, [allProducts, searchTerm, selectedCategory, selectedProductionType, selectedManufacturer]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setSelectedProductionType(null);
    setSelectedManufacturer(null);
  };
  
  const renderContent = () => {
    if (isLoadingProducts) {
      return (
        <div className="flex items-center justify-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Loading products...</p>
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
      )
    }
    if (filteredProducts.length > 0) {
      return (
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Dosage</TableHead>
              <TableHead>Suitable For</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{product.dose || '-'}</TableCell>
                <TableCell>{(product.suitableForProduction || []).join(', ')}</TableCell>
                <TableCell>{product.manufacturer}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)} className="mr-2" title="View/Edit Product Details">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="Delete Product (Disabled)" disabled className="text-destructive hover:text-destructive/90">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. To permanently delete the product "{product.name}", please remove it from the Admin Catalog.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    return (
       <p className="p-6 text-center text-muted-foreground">
        {searchTerm || selectedCategory || selectedProductionType || selectedManufacturer ? 'No products match your search or filter.' : 'No products found. Add products via the Admin Panel.'}
      </p>
    );
  };

  return (
    <div className="container mx-auto p-4 py-6 md:p-8 md:py-10 flex flex-col h-full">
    <PageHeader
        title="Manage Products"
        description="View your full product catalog. To add or edit products, use the Admin Panel."
    >
        <Button onClick={handleAddNewProduct} disabled>
        <PlusCircle className="mr-2 h-4 w-4" /> Add New Product (Use Admin Panel)
        </Button>
    </PageHeader>

    <Card className="flex-grow flex flex-col overflow-hidden mt-6">
        <CardHeader className="flex-shrink-0 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
            <CardTitle>Product List</CardTitle>
            <CardDescription>
                {isLoadingProducts
                ? 'Φόρτωση προϊόντων...'
                : `Βρέθηκαν ${allProducts.length} προϊόντα στον κατάλογο.`}
            </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0">
                    <Wheat className="mr-2 h-4 w-4" />
                    {selectedProductionType || "Filter by Production"}
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filter by Production Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setSelectedProductionType(null)}>
                    All Production Types
                </DropdownMenuItem>
                {availableProductionTypes.map((type) => (
                    <DropdownMenuItem key={type} onSelect={() => setSelectedProductionType(type)}>
                    {type}
                    </DropdownMenuItem>
                ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0">
                    <ListFilter className="mr-2 h-4 w-4" />
                    {selectedCategory || "Filter by Category"}
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setSelectedCategory(null)}>
                    All Categories
                </DropdownMenuItem>
                {availableCategories.map((category) => (
                    <DropdownMenuItem key={category} onSelect={() => setSelectedCategory(category)}>
                    {category}
                    </DropdownMenuItem>
                ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0">
                    <Building className="mr-2 h-4 w-4" />
                    {selectedManufacturer || "Filter by Manufacturer"}
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filter by Manufacturer</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setSelectedManufacturer(null)}>
                    All Manufacturers
                </DropdownMenuItem>
                {availableManufacturers.map((manufacturer) => (
                    <DropdownMenuItem key={manufacturer} onSelect={() => setSelectedManufacturer(manufacturer)}>
                    {manufacturer}
                    </DropdownMenuItem>
                ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="icon" onClick={clearFilters} title="Clear All Filters & Search">
                <RotateCcw className="h-4 w-4" />
            </Button>
            </div>
        </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-0">
        {renderContent()}
        </CardContent>
    </Card>

    <ProductDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        product={editingProduct}
    />
    </div>
  );
}
