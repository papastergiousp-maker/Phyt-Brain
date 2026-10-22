// src/firebase/index.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Firestore;

function initializeFirebase(): FirebaseServices {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  
  return { app: firebaseApp, auth, db };
}

// Export the initialization function and individual services
export { initializeFirebase };

// Export providers and hooks for convenience
export { FirebaseProvider, useFirebase } from './provider';
export { FirebaseClientProvider } from './client-provider';
