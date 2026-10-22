
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
import { LoginSchema, type LoginFormData } from '@/lib/schemas';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useFirebase } from '@/firebase';

const REMEMBER_ME_KEY = 'phyt-ai-remember-me-email';

export function LoginForm() {
  const { auth } = useFirebase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBER_ME_KEY);
    if (rememberedEmail) {
      form.setValue('email', rememberedEmail);
      form.setValue('rememberMe', true);
    }
  }, [form]);

  async function onSubmit(data: LoginFormData) {
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
      await signInWithEmailAndPassword(auth, data.email, data.password);
      
      if (data.rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, data.email);
      } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
      }
      
      toast({
          title: 'Επιτυχής Σύνδεση',
          description: 'Καλώς ορίσατε ξανά!',
      });
      
      // The root layout will handle the redirect, so we don't need to do it here.
      // This prevents race conditions.
      // router.replace('/dashboard');


    } catch (error: any) {
        let errorMessage = "An unknown error occurred during sign-in.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = "Το email ή ο κωδικός πρόσβασης είναι λανθασμένος.";
        } else {
            console.error("Firebase Login Error:", error);
            errorMessage = "Παρουσιάστηκε ένα σφάλμα κατά τη σύνδεση.";
        }

        toast({
            title: "Η Σύνδεση Απέτυχε",
            description: errorMessage,
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormLabel className="font-normal text-sm !mt-0">
                  Απομνημόνευση
                </FormLabel>
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Σύνδεση
          </Button>
        </form>
      </Form>
    </>
  );
}
