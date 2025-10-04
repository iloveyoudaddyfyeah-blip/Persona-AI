
'use server';

import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

interface FirebaseAdminSDKs {
  app: App;
  auth: Auth;
  firestore: Firestore;
}

export function getFirebaseAdmin(): FirebaseAdminSDKs {
  if (getApps().length === 0) {
    initializeApp();
  }
  const app = getApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return { app, auth, firestore };
}
