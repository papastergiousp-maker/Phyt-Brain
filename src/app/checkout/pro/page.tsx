
// src/app/checkout/pro/page.tsx
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CheckoutProPage() {
  return (
    <div className="container mx-auto py-12 px-4 text-center">
      <PageHeader title="Ολοκλήρωση Αγοράς - Pro Πακέτο" description="Αυτή η σελίδα είναι υπό κατασκευή." />
      <p className="text-lg mt-4">Ευχαριστούμε για το ενδιαφέρον σας για το Pro πακέτο!</p>
      <p className="mt-2 text-muted-foreground">Η διαδικασία ολοκλήρωσης αγοράς θα είναι σύντομα διαθέσιμη.</p>
      <Button asChild className="mt-8">
        <Link href="/pricing">Επιστροφή στην Τιμολόγηση</Link>
      </Button>
    </div>
  );
}
