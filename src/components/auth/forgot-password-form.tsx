
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ForgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/schemas';
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        toast({
            title: "Ελέγξτε το Email σας",
            description: "Ένα email για την ανάκτηση του κωδικού σας έχει σταλεί στη διεύθυνση που δηλώσατε (προσομοίωση).",
        });
        setEmailSent(true);
        setIsLoading(false);
    }, 1500);
  }

  if (emailSent) {
    return (
        <div className="text-center text-sm text-muted-foreground">
            <p>Εάν το email που δώσατε υπάρχει στο σύστημά μας, θα λάβετε σύντομα ένα σύνδεσμο για την ανάκτηση του κωδικού σας.</p>
        </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Αποστολή Email Ανάκτησης
        </Button>
      </form>
    </Form>
  );
}
