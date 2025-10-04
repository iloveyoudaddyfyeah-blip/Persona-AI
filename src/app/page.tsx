
'use client';

import PersonaCraftClientPage from "./_components/PersonaCraftClientPage";
import { FirebaseProvider } from "@/firebase/FirebaseProvider";

export default function Home() {
  return (
    <FirebaseProvider>
      <PersonaCraftClientPage />
    </FirebaseProvider>
  );
}
