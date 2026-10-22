"use client";

import { Logo } from '@/components/shared/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NoAccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl text-center">
        <CardHeader className="items-center">
          <Logo />
          <CardTitle className="mt-4 text-xl">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Thank you for using our services.
          </p>
          <p className="mt-2 font-semibold text-destructive">
            You need to renew your subscription in order to use our services.
          </p>
          {/* You could add a link to a contact page or subscription page here if available */}
          {/* <Button asChild className="mt-6">
            <Link href="/contact-sales">Contact Sales</Link>
          </Button> */}
        </CardContent>
      </Card>
      <footer className="absolute bottom-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Phyt AI. All rights reserved.
      </footer>
    </div>
  );
}
