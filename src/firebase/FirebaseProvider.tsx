
'use client';

import { useAuth } from './auth';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  useAuth(); // Initialize auth listener
  return <>{children}</>;
}
