
// src/app/contact-sales/page.tsx
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ContactSalesPage() {
 return (
    <div className="container mx-auto py-12 px-4 text-center">
      <PageHeader title="Επικοινωνία για Πωλήσεις - Επιχείρηση Plus" description="Αυτή η σελίδα είναι υπό κατασκευή." />
      <p className="text-lg mt-4">Ευχαριστούμε για το ενδιαφέρον σας για το πακέτο Επιχείρηση Plus!</p>
      <p className="mt-2 text-muted-foreground">Παρακαλούμε επικοινωνήστε μαζί μας στο <a href="mailto:info@phytai.com" className="text-primary hover:underline">info@phytai.com</a> για περισσότερες πληροφορίες.</p>
      <Button asChild className="mt-8">
        <Link href="/pricing">Επιστροφή στην Τιμολόγηση</Link>
      </Button>
    </div>
  );
}
