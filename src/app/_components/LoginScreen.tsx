
'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Chrome } from 'lucide-react';
import Image from 'next/image';

export default function LoginScreen() {
  const auth = useAuth();
  
  const handleLogin = () => {
    initiateGoogleSignIn(auth);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="text-center">
        <Image
          src="https://images.unsplash.com/photo-1516934024742-b60b8b93356f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxmb3h8ZW58MHx8fHwxNzYwMjE2NjU1fDA&ixlib=rb-4.1.0&q=80&w=1080"
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
