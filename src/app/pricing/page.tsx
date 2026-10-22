
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Zap, Star, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAgroStore, type User } from '@/lib/store';
import type { UserRole } from '@/types';
import { useRouter } from 'next/navigation';

interface PricingPlanProps {
  title: string;
  price: string;
  features: string[];
  icon: React.ElementType;
  highlight?: boolean;
  actionLabel?: string;
  actionLink?: string;
  upgradeToRole?: UserRole;
}

function PricingPlanCard({ title, price, features, icon: Icon, highlight = false, actionLabel = "Επιλογή Πακέτου", actionLink = "/signup", upgradeToRole }: PricingPlanProps) {
  const { user, isAuthenticated, upgradeUserToRole } = useAgroStore(state => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    upgradeUserToRole: state.updateUserRole, // Corrected to use the right action
  }));
  const { toast } = useToast();
  const router = useRouter();

  const handleActionClick = () => {
    if (upgradeToRole) {
      if (isAuthenticated && user) {
        upgradeUserToRole(user.id, upgradeToRole);
        toast({
          title: `Αναβάθμιση σε ${title}!`,
          description: `Ο λογαριασμός σας έχει αναβαθμιστεί. (Προσομοίωση επιτυχούς πληρωμής)`,
        });
        router.push('/dashboard');
      } else {
        toast({
          title: 'Απαιτείται Σύνδεση',
          description: 'Πρέπει να συνδεθείτε για να αναβαθμίσετε το πακέτο σας.',
          variant: 'destructive',
        });
        router.push('/login');
      }
    } else {
      router.push(actionLink);
    }
  };

  return (
    <Card className={`flex flex-col ${highlight ? 'border-primary shadow-xl ring-2 ring-primary' : 'shadow-lg'}`}>
      <CardHeader className="items-center text-center">
        <Icon className={`w-12 h-12 mb-3 ${highlight ? 'text-primary' : 'text-accent'}`} />
        <CardTitle className="text-2xl font-headline">{title}</CardTitle>
        <CardDescription className="text-4xl font-bold text-foreground mt-2">{price}</CardDescription>
        <p className="text-sm text-muted-foreground">{title === "Δωρεάν" ? "Για πάντα δωρεάν" : "/ μήνα"}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-3 text-sm">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <div className="p-6 pt-0 mt-auto">
        <Button onClick={handleActionClick} className={`w-full ${highlight ? '' : 'bg-accent hover:bg-accent/90'}`}>
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
}

export default function PricingPage() {
  const plans: PricingPlanProps[] = [
    {
      title: 'Δωρεάν Εξερευνητής',
      price: '€0',
      icon: Zap,
      features: [
        `3 ερωτήσεις AI / ημέρα (επισκέπτες)`,
        `6 ερωτήσεις AI / ημέρα (συνδεδεμένοι)`,
        `Βασική ανάλυση εικόνας (ανέβασμα)`,
        'Πρόγνωση καιρού',
      ],
      actionLabel: "Ξεκινήστε Τώρα",
      actionLink: "/signup"
    },
    {
      title: 'Pro Αγρότης',
      price: '€19',
      icon: Star,
      highlight: true,
      features: [
        '100 ερωτήσεις AI / μήνα',
        'Προηγμένη ανάλυση εικόνας',
        'Αποθήκευση ιστορικού ερωτήσεων',
        'Ειδοποιήσεις καιρού',
        'Υποστήριξη προτεραιότητας',
      ],
      actionLabel: "Αναβάθμιση σε Pro",
      upgradeToRole: 'farmer-pro'
    },
    {
      title: 'Επιχείρηση Plus',
      price: '€49',
      icon: Briefcase,
      features: [
        'Απεριόριστες ερωτήσεις AI',
        'Όλα τα χαρακτηριστικά του Pro',
        'Ανάλυση πολλαπλών χρηστών',
        'Προσαρμοσμένες αναφορές',
        'API πρόσβαση (προσεχώς)',
      ],
      actionLabel: "Αναβάθμιση σε Επιχείρηση",
      upgradeToRole: 'company'
    },
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      <PageHeader
        title="Πακέτα Τιμολόγησης Phyt AI"
        description="Επιλέξτε το πακέτο που ταιριάζει καλύτερα στις ανάγκες της γεωργικής σας επιχείρησης."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
        {plans.map((plan) => (
          <PricingPlanCard key={plan.title} {...plan} />
        ))}
      </div>
       <div className="mt-12 text-center">
        <p className="text-muted-foreground">
          Έχετε ερωτήσεις; <Link href="/contact" className="text-primary hover:underline">Επικοινωνήστε μαζί μας</Link>.
        </p>
      </div>
    </div>
  );
}
