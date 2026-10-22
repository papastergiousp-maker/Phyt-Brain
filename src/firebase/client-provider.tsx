// src/firebase/client-provider.tsx
'use client';

import { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './index';

// This provider ensures that Firebase is initialized only once on the client-side
// and makes the Firebase services available to all client components via the `useFirebase` hook.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const firebaseServices = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider value={firebaseServices}>
      {children}
    </FirebaseProvider>
  );
}
