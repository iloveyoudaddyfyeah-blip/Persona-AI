
'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { User } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginScreen() {
  const auth = useAuth();
  
  const handleLogin = () => {
    if (auth) {
      initiateAnonymousSignIn(auth);
    }
  };

  const welcomeImage = PlaceHolderImages.find(img => img.id === 'welcome-soul');

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="text-center">
        {welcomeImage && (
            <Image
              src={welcomeImage.imageUrl}
              alt={welcomeImage.description}
              width={256}
              height={256}
              data-ai-hint={welcomeImage.imageHint}
              className="mx-auto mb-8 rounded-full mix-blend-multiply dark:mix-blend-screen"
              unoptimized
            />
        )}
        <h1 className="text-5xl font-headline mb-4">Welcome to PersonaCraft AI</h1>
        <p className="text-2xl max-w-2xl mb-8 text-muted-foreground">
          Continue anonymously to begin creating and interacting with AI personas.
        </p>
        <Button onClick={handleLogin} size="lg" className="text-2xl h-14 px-8">
          <User className="mr-3 h-7 w-7" />
          Continue Anonymously
        </Button>
      </div>
    </div>
  );
}
