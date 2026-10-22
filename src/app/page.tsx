
'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/logo';

// This page is now the public landing page.
// The root layout handles redirection for logged-in users.
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="mb-8">
        <Logo size="large" />
      </div>
      <h1 className="text-4xl font-bold font-headline tracking-tighter sm:text-5xl md:text-6xl">
        Καλώς ορίσατε στο Phyt AI
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Ο έξυπνος βοηθός σας για τη γεωργία. Λάβετε συμβουλές, αναλύστε προβλήματα και βελτιστοποιήστε τις καλλιέργειές σας.
      </p>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/login">Σύνδεση</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/signup">Δωρεάν Εγγραφή</Link>
        </Button>
      </div>
       <footer className="absolute bottom-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Phyt AI. All rights reserved.
      </footer>
    </div>
  );
}
