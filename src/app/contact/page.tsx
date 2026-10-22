
'use client';

// src/app/contact/page.tsx
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPinIcon } from 'lucide-react';

export default function ContactPage() {
 return (
    <div className="container mx-auto py-12 px-4">
      <PageHeader title="Επικοινωνήστε Μαζί Μας" description="Είμαστε εδώ για να απαντήσουμε στις ερωτήσεις σας." />
      
      <div className="grid md:grid-cols-2 gap-10 mt-10">
        <Card>
          <CardHeader>
            <CardTitle>Στοιχεία Επικοινωνίας</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <Mail className="w-5 h-5 mr-3 text-primary" />
              <a href="mailto:info@phytai.com" className="hover:underline">info@phytai.com</a>
            </div>
            <div className="flex items-center">
              <Phone className="w-5 h-5 mr-3 text-primary" />
              <span>+30 210 1234567</span>
            </div>
            <div className="flex items-start">
              <MapPinIcon className="w-5 h-5 mr-3 text-primary mt-1" />
              <span>
                Agro AI Headquarters<br />
                Λεωφόρος Καινοτομίας 123<br />
                Αθήνα, 10100, Ελλάδα
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Φόρμα Επικοινωνίας</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Η φόρμα επικοινωνίας είναι υπό κατασκευή. Μπορείτε να μας στείλετε email προς το παρόν.</p>
            {/* Placeholder for a contact form */}
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Όνομα</label>
                <input type="text" name="name" id="name" disabled className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed p-2" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" id="email" disabled className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed p-2" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Μήνυμα</label>
                <textarea name="message" id="message" rows={4} disabled className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed p-2"></textarea>
              </div>
              <Button disabled className="w-full">Υποβολή (Εκτός Λειτουργίας)</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-12">
        <Button asChild variant="outline">
            <Link href="/">Επιστροφή στην Αρχική</Link>
        </Button>
      </div>
    </div>
  );
}
