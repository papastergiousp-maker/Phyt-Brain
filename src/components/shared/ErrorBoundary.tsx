
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In a real app, you would log this to an error reporting service
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle className="mt-4">Παρουσιάστηκε ένα Σφάλμα</CardTitle>
                    <CardDescription>
                        Κάτι πήγε στραβά. Η ομάδα μας έχει ειδοποιηθεί.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Παρακαλούμε ανανεώστε τη σελίδα. Εάν το πρόβλημα επιμένει, επικοινωνήστε με την υποστήριξη.
                    </p>
                    <Button onClick={() => window.location.reload()} className="mt-6">
                        Ανανέωση Σελίδας
                    </Button>
                </CardContent>
            </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
