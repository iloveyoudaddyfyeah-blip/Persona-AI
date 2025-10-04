
'use client';

import { Button } from '@/components/ui/button';
import { auth } from '@/firebase/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Chrome } from 'lucide-react';
import Image from 'next/image';

export default function LoginScreen() {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error during sign-in:', error);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="text-center">
        <Image
          src="https://i.ibb.co/6gZ0s2B/cat-girl-paw-hoodie.png"
          alt="Welcome"
          width={256}
          height={256}
          className="mx-auto mb-8 rounded-full mix-blend-multiply dark:mix-blend-screen"
          unoptimized
        />
        <h1 className="text-5xl font-headline mb-4">Welcome to PersonaCraft AI</h1>
        <p className="text-2xl max-w-2xl mb-8 text-muted-foreground">
          Sign in with your Google account to begin creating and interacting with AI personas.
        </p>
        <Button onClick={handleLogin} size="lg" className="text-2xl h-14 px-8">
          <Chrome className="mr-3 h-7 w-7" />
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
