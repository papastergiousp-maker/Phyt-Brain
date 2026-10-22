
'use client';

import type { ReactNode } from 'react';
import { Logo } from '@/components/shared/logo';

export default function AuthLayout({ children }: { children: ReactNode }) {
  // This layout is now simplified and no longer handles redirects.
  // All redirect logic is centralized in the root layout (src/app/layout.tsx)
  // to prevent redirect loops and race conditions.
  return (
    <div className="flex min-h-screen flex-col items-center bg-background p-4">
      <div className="flex flex-1 flex-col items-center justify-center">
          <div className="mb-8 flex justify-center">
              <Logo size="large" />
          </div>
          <main className="w-full max-w-md">{children}</main>
      </div>
      <footer className="w-full shrink-0 py-6 text-center text-sm text-muted-foreground">
             &copy; {new Date().getFullYear()} Phyt AI. All rights reserved.
      </footer>
    </div>
  );
}
