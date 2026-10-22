
'use client';

import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useAgroStore, type User, type QueryRecord } from '@/lib/store';
import { useFirebase } from '@/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth } = useFirebase();
  const { login, logout, setQueryHistory } = useAgroStore.getState();
  const user = useAgroStore(state => state.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
        setLoading(false);
        logout();
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const basicUser: User = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Phyt User',
            email: firebaseUser.email || 'no-email@phyt.ai',
            role: 'farmer',
            createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
            photoURL: firebaseUser.photoURL,
        };
        login(basicUser);
        setLoading(false);
      } else {
        logout();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  useEffect(() => {
    // This is a placeholder for potential future integration with a backend.
    // For now, it does nothing as data is managed locally.
    if (!user) {
      setQueryHistory([]);
    }
  }, [user, setQueryHistory]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
