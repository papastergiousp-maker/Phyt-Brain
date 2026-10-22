
'use client';

import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl">
          Καλώς Ορίσατε
        </CardTitle>
        <CardDescription>Εισάγετε τα στοιχεία σας για πρόσβαση στον πίνακα ελέγχου.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <div className="mt-4 text-center text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Ξεχάσατε τον κωδικό σας;
          </Link>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Δεν έχετε λογαριασμό;{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Εγγραφή
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
