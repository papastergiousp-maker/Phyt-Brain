
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAgroStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, FileText, X, UploadCloud, Briefcase, ShieldAlert, Users, Ticket, Search, RotateCcw, Award, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PromoCode } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { UserRole } from '@/types';
import { userRoles } from '@/types';
import { grantLicensesToAction } from '@/actions/admin-actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ChevronsUpDown } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import type { RegisteredUser, User } from '@/lib/types';


export default function AdminSettingsPage() {
  const { 
    user,
    updateUserRole,
    grantLicensesToAgronomist,
    promoCodes,
    generatePromoCodes,
  } = useAgroStore();
  const router = useRouter();
  const { toast } = useToast();
  
  // The admin page now sources users from the local store, consistent with the rest of the app.
  // In a real app with a backend, this would fetch all users.
  // For this demo, we can only see the currently logged-in user in the store.
  const registeredUsers: User[] = useMemo(() => (user ? [user] : []), [user]);

  // States for User Management tab
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // States for Promo Code tab
  const [promoPrefix, setPromoPrefix] = useState('AGRIPRO');
  const [promoCount, setPromoCount] = useState<number | string>(10);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [promoCodeSearchTerm, setPromoCodeSearchTerm] = useState('');

  // States for License Management
  const [selectedAgronomist, setSelectedAgronomist] = useState('');
  const [licenseCount, setLicenseCount] = useState<number | string>(10);
  const [isGranting, setIsGranting] = useState(false);
  const [isAgronomistPopoverOpen, setIsAgronomistPopoverOpen] = useState(false);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const isAdmin = user?.email?.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase();
  
  useEffect(() => {
    if (user === undefined) return;
    if (user === null || !isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
        variant: 'destructive'
      });
      router.replace('/dashboard');
    } else {
      setIsCheckingAuth(false);
    }
  }, [user, isAdmin, router, toast]);


  const handleGenerateCodes = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!promoPrefix || !promoCount) {
          toast({ title: 'Missing Information', description: 'Please provide a prefix and count.', variant: 'destructive' });
          return;
      }
      setIsGeneratingCodes(true);
      const newCodes = generatePromoCodes(promoPrefix, Number(promoCount));
      setGeneratedCodes(newCodes);
      toast({ title: 'Codes Generated!', description: `${newCodes.length} new promo codes were created.` });
      setIsGeneratingCodes(false);
  };

  const filteredPromoCodes = useMemo(() => {
    if (!promoCodeSearchTerm) {
      return promoCodes;
    }
    const lowerCaseSearchTerm = promoCodeSearchTerm.toLowerCase();
    return promoCodes.filter(
      (code) =>
        code.code.toLowerCase().includes(lowerCaseSearchTerm) ||
        (code.redeemedBy && code.redeemedBy.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [promoCodes, promoCodeSearchTerm]);


  const filteredUsers = useMemo(() => {
    return registeredUsers.filter(u =>
      (u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [registeredUsers, userSearchTerm]);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    updateUserRole(userId, newRole);
    toast({ title: 'User Role Updated' });
  };
  
  const agronomists = useMemo(() => {
    return registeredUsers.filter(u => u.role.includes('agronomist') || u.role.includes('company'));
  }, [registeredUsers]);
  
  const handleGrantLicenses = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAgronomist) {
        toast({ title: 'No Agronomist Selected', description: 'Please select an agronomist.', variant: 'destructive' });
        return;
    }
    setIsGranting(true);
    // This is now a simulated action, the real update happens in the client state
    const result = await grantLicensesToAction({ agronomistId: selectedAgronomist, licenseCount: Number(licenseCount) });
    if (result.success) {
        grantLicensesToAgronomist(selectedAgronomist, Number(licenseCount));
        toast({ title: 'Licenses Granted!', description: result.message });
    } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsGranting(false);
  };


  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 py-6 md:p-8 md:py-10">
      <PageHeader title="Admin Settings" description="Manage the AI's knowledge base, users, and promotional codes." />
      <Tabs defaultValue="promo-codes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="license-management">License Mgt</TabsTrigger>
          <TabsTrigger value="promo-codes">Promo Codes</TabsTrigger>
          <TabsTrigger value="user-management">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="license-management" className="mt-6">
              <Card className="shadow-lg">
                  <CardHeader>
                      <CardTitle className="font-headline flex items-center"><Award className="mr-2"/> License Management</CardTitle>
                      <CardDescription>Grant "Pro Farmer" licenses to agronomists.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <form onSubmit={handleGrantLicenses} className="space-y-4">
                          <div className="space-y-2">
                              <Label htmlFor="agronomist-select">Agronomist</Label>
                              <Popover open={isAgronomistPopoverOpen} onOpenChange={setIsAgronomistPopoverOpen}>
                                  <PopoverTrigger asChild>
                                      <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={isAgronomistPopoverOpen}
                                      className="w-full justify-between"
                                      >
                                      {selectedAgronomist
                                          ? registeredUsers.find((u) => u.id === selectedAgronomist)?.email
                                          : "Select agronomist..."}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                      <Command>
                                          <CommandInput placeholder="Search agronomist..." />
                                          <CommandEmpty>No agronomist found.</CommandEmpty>
                                          <CommandList>
                                              {agronomists.map((agronomist) => (
                                                  <CommandItem
                                                  value={agronomist.email}
                                                  key={agronomist.id}
                                                  onSelect={() => {
                                                      setSelectedAgronomist(agronomist.id)
                                                      setIsAgronomistPopoverOpen(false)
                                                  }}
                                                  >
                                                  <Check
                                                      className={cn(
                                                      "mr-2 h-4 w-4",
                                                      selectedAgronomist === agronomist.id ? "opacity-100" : "opacity-0"
                                                      )}
                                                  />
                                                  <div className="flex flex-col">
                                                  <span>{agronomist.name} ({agronomist.email})</span>
                                                  <span className="text-xs text-muted-foreground">Current Licenses: {agronomist.proLicenseCount || 0}</span>
                                                  </div>
                                                  </CommandItem>
                                              ))}
                                          </CommandList>
                                      </Command>
                                  </PopoverContent>
                              </Popover>
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="license-count">Number of Pro Licenses</Label>
                              <Input id="license-count" type="number" placeholder="10" value={licenseCount} onChange={(e) => setLicenseCount(e.target.value)} min="0" disabled={isGranting} />
                          </div>
                          <Button type="submit" disabled={isGranting || !selectedAgronomist} className="w-full">
                              {isGranting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Award className="mr-2 h-4 w-4"/>}
                              {isGranting ? 'Granting...' : 'Grant Licenses'}
                          </Button>
                      </form>
                  </CardContent>
              </Card>
          </TabsContent>
          
          <TabsContent value="promo-codes" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="shadow-lg">
                      <CardHeader>
                          <CardTitle className="font-headline flex items-center"><Ticket className="mr-2"/>Generate Promo Codes</CardTitle>
                          <CardDescription>Create new promo codes for users to redeem for premium roles.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <form onSubmit={handleGenerateCodes} className="space-y-4">
                              <div className="space-y-2">
                                  <Label htmlFor="promo-prefix">Code Prefix</Label>
                                  <Input id="promo-prefix" placeholder="e.g., AGRIPRO" value={promoPrefix} onChange={(e) => setPromoPrefix(e.target.value)} disabled={isGeneratingCodes} />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="promo-count">Number of Codes</Label>
                                  <Input id="promo-count" type="number" placeholder="10" value={promoCount} onChange={(e) => setPromoCount(e.target.value)} min="1" max="1000" disabled={isGeneratingCodes} />
                              </div>
                              <Button type="submit" disabled={isGeneratingCodes} className="w-full">
                                  {isGeneratingCodes ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Ticket className="mr-2 h-4 w-4"/>}
                                  {isGeneratingCodes ? 'Generating...' : 'Generate Codes'}
                              </Button>
                          </form>
                          {generatedCodes && generatedCodes.length > 0 && (
                              <div className="mt-4">
                                  <Label>Newly Generated Codes ({generatedCodes.length})</Label>
                                  <ScrollArea className="h-40 mt-2 rounded-md border p-2 bg-muted/50">
                                      <pre className="text-xs">{generatedCodes.join('\n')}</pre>
                                  </ScrollArea>
                                  <Button variant="outline" size="sm" className="mt-2" onClick={() => navigator.clipboard.writeText(generatedCodes.join('\n'))}>Copy Codes</Button>
                              </div>
                          )}
                      </CardContent>
                  </Card>
                  <Card className="shadow-lg">
                      <CardHeader>
                          <CardTitle className="font-headline">All Promo Codes ({promoCodes.length})</CardTitle>
                          <CardDescription>List of all generated promotional codes and their status.</CardDescription>
                          <div className="relative pt-2">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                  placeholder="Search codes..."
                                  value={promoCodeSearchTerm}
                                  onChange={(e) => setPromoCodeSearchTerm(e.target.value)}
                                  className="pl-9"
                              />
                          </div>
                      </CardHeader>
                      <CardContent>
                      <ScrollArea className="h-[260px] border rounded-md">
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Code</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Redeemed By</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {filteredPromoCodes.map(code => (
                                      <TableRow key={code.code}>
                                          <TableCell className="font-mono text-xs">{code.code}</TableCell>
                                          <TableCell>
                                              <Badge variant={code.redeemed ? 'secondary' : 'default'}>{code.redeemed ? 'Redeemed' : 'Active'}</Badge>
                                          </TableCell>
                                          <TableCell className="text-xs">{code.redeemedBy || '-'}</TableCell>
                                      </TableRow>
                                  ))}
                                  {filteredPromoCodes.length === 0 && (
                                      <TableRow>
                                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                                              No codes match your search.
                                          </TableCell>
                                      </TableRow>
                                  )}
                              </TableBody>
                          </Table>
                      </ScrollArea>
                      </CardContent>
                  </Card>
              </div>
          </TabsContent>

          <TabsContent value="user-management" className="mt-6">
          <Card className="shadow-lg">
              <CardHeader>
              <CardTitle className="font-headline flex items-center">
                  <Users className="mr-2 h-6 w-6 text-primary" />
                  User Management
              </CardTitle>
              <CardDescription>View all registered users and manage their roles and access levels.</CardDescription>
              </CardHeader>
              <CardContent>
              <div className="flex items-center py-4">
                  <Input
                  placeholder="Filter users by name or email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="max-w-sm"
                  />
              </div>
              <div className="rounded-md border">
                  <Table>
                  <TableHeader>
                      <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Licenses</TableHead>
                      <TableHead>Change Role</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                          <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                              <Badge variant="secondary">{userRoles.find(r => r.value === u.role)?.label || u.role}</Badge>
                          </TableCell>
                          <TableCell>
                              {u.role.includes('agronomist') ? `${u.grantedProFarmerIds?.length || 0} / ${u.proLicenseCount || 0}` : '-'}
                          </TableCell>
                          <TableCell>
                              {u.email.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase() ? (
                              <Badge>Super Admin</Badge>
                              ) : (
                              <Select
                                  value={u.role}
                                  onValueChange={(newRole) => handleRoleChange(u.id, newRole as UserRole)}
                              >
                                  <SelectTrigger className="w-[220px]">
                                  <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                  {userRoles.map((roleOption) => (
                                      <SelectItem key={roleOption.value} value={roleOption.value}>
                                      {roleOption.label}
                                      </SelectItem>
                                  ))}
                                  </SelectContent>
                              </Select>
                              )}
                          </TableCell>
                          </TableRow>
                      ))
                      ) : (
                      <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                          No users found.
                          </TableCell>
                      </TableRow>
                      )}
                  </TableBody>
                  </Table>
              </div>
              </CardContent>
          </Card>
          </TabsContent>
      </Tabs>
    </div>
  );
}
