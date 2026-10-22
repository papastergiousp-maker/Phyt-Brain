import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl">
          Ανάκτηση Κωδικού
        </CardTitle>
        <CardDescription>Εισάγετε το email σας για να λάβετε σύνδεσμο ανάκτησης.</CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Θυμηθήκατε τον κωδικό σας;{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Σύνδεση
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
