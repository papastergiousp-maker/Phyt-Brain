
"use client";

import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StaffMember, StaffRank } from '@/lib/types';
import { useAgroStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface StaffDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  staffMember?: StaffMember;
}

const defaultStaffState: Omit<StaffMember, 'id'> = {
  name: '',
  email: '',
  rank: 'Staff',
};

const rankOptions: StaffRank[] = ['Staff', 'Management', 'No Access'];

export function StaffDialog({ isOpen, setIsOpen, staffMember }: StaffDialogProps) {
  const addStaffMember = useAgroStore(state => state.addStaffMember);
  const updateStaffMember = useAgroStore(state => state.updateStaffMember);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Omit<StaffMember, 'id'>>(defaultStaffState);

  useEffect(() => {
    if (staffMember) {
      setFormData({ name: staffMember.name, email: staffMember.email, rank: staffMember.rank });
    } else {
      setFormData(defaultStaffState);
    }
  }, [staffMember, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRankChange = (value: string) => {
    setFormData(prev => ({ ...prev, rank: value as StaffRank }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.rank) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Email, Rank).",
        variant: "destructive",
      });
      return;
    }
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
        toast({
            title: "Validation Error",
            description: "Please enter a valid email address.",
            variant: "destructive",
        });
        return;
    }


    if (staffMember) {
      updateStaffMember({ ...formData, id: staffMember.id });
      toast({ title: "Staff Member Updated", description: `"${formData.name}" has been updated.` });
    } else {
      addStaffMember(formData);
      toast({ title: "Staff Member Added", description: `"${formData.name}" has been added.` });
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{staffMember ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
          <DialogDescription>
            {staffMember ? 'Update the details of this staff member.' : 'Fill in the details for the new staff member.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name*</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email*</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rank" className="text-right">Rank*</Label>
            <Select name="rank" value={formData.rank} onValueChange={handleRankChange}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select rank" />
              </SelectTrigger>
              <SelectContent>
                {rankOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit}>Save Staff Member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
