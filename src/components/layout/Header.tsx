
'use client';

import React from 'react';
import { ThemeToggle } from '../settings/ThemeToggle';
import SettingsDialog from '../settings/SettingsDialog';
import { useUser, useAuth } from '@/firebase';
import { Button } from '../ui/button';
import { signOut } from 'firebase/auth';
import { Loader2, LogIn, LogOut } from 'lucide-react';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';

export default function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleLogin = () => {
    initiateGoogleSignIn(auth);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error during sign-out:', error);
    }
  };

  const renderAuthButton = () => {
    if (isUserLoading) {
      return <Button variant="ghost" size="icon" disabled><Loader2 className="h-6 w-6 animate-spin" /></Button>;
    }
    if (user) {
      return (
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
          <LogOut className="h-6 w-6" />
        </Button>
      );
    }
    return (
      <Button variant="ghost" size="icon" onClick={handleLogin} title="Login with Google">
        <LogIn className="h-6 w-6" />
      </Button>
    );
  };

  return (
    <header className="p-4 border-b border-border flex items-center justify-between">
      <div className="flex items-center gap-2 w-24 justify-start">
        {renderAuthButton()}
      </div>
      <h1 className="text-4xl text-foreground font-headline text-center">PersonaCraft AI</h1>
      <div className="flex items-center gap-2 w-24 justify-end">
        <SettingsDialog />
        <ThemeToggle />
      </div>
    </header>
  );
}
