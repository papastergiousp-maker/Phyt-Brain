
'use client';

import { PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { siteConfig } from '@/config/site';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { FirebaseClientProvider } from '@/firebase';

const ptSans = PT_Sans({
  subsets: ['latin', 'cyrillic-ext'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-pt-sans',
});

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      // While auth is loading, don't do any redirects.
      return;
    }

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password');
    const isPublicPage = ['/', '/terms', '/privacy', '/pricing', '/contact', '/contact-sales', '/checkout/pro'].includes(pathname);

    if (user) {
      // User is logged in
      if (isAuthPage) {
        router.replace('/dashboard');
      }
    } else {
      // User is not logged in
      if (!isAuthPage && !isPublicPage) {
        router.replace('/login');
      }
    }
  }, [user, loading, pathname, router]);

  // Always show a loading screen while auth is in progress, unless it's a public page
  // This prevents the flicker of protected content for a logged-out user.
  const isPublicRoute = ['/login', '/signup', '/forgot-password', '/', '/terms', '/privacy', '/pricing', '/contact', '/contact-sales', '/checkout/pro'].includes(pathname);
  if (loading && !isPublicRoute) {
     return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  // Determine if the AppShell should be rendered
  const isProtectedRoute = !isPublicRoute;
  
  if (user && isProtectedRoute) {
    return (
      <SidebarProvider>
        <AppShell user={user}>
          {children}
        </AppShell>
      </SidebarProvider>
    );
  }
  
  // For public routes or when the user is logged out
  return <>{children}</>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="el" suppressHydrationWarning className={ptSans.variable}>
      <head>
          <title>{siteConfig.name}</title>
          <meta name="description" content={siteConfig.description} />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background text-foreground">
        <ErrorBoundary>
          <FirebaseClientProvider>
            <AuthProvider>
              <FirebaseErrorListener />
              <AppContent>{children}</AppContent>
            </AuthProvider>
          </FirebaseClientProvider>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
