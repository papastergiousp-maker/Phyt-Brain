
import Link from 'next/link';
import { SignupForm } from '@/components/auth/signup-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl">
          Δημιουργία Λογαριασμού
        </CardTitle>
        <CardDescription>Συμπληρώστε τα στοιχεία για να γίνετε μέλος του Phyt AI.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Έχετε ήδη λογαριασμό;{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Σύνδεση
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
