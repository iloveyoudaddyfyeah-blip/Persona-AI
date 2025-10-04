
'use client';

import PersonaCraftClientPage from "./_components/PersonaCraftClientPage";
import { FirebaseClientProvider } from "@/firebase/client-provider";


export default function Home() {
  return (
    <FirebaseClientProvider>
      <PersonaCraftClientPage />
    </FirebaseClientProvider>
  );
}
