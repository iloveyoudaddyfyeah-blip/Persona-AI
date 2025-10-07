
'use client';

import React from 'react';
import SettingsDialog from '../settings/SettingsDialog';
import { useUser, useAuth } from '@/firebase';
import { Button } from '../ui/button';
import { signOut } from 'firebase/auth';
import { Loader2, LogIn, LogOut } from 'lucide-react';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';

export default function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleLogin = () => {
    if (auth) {
        initiateAnonymousSignIn(auth);
    }
  };

  const handleLogout = async () => {
    if (auth) {
        try {
        await signOut(auth);
        } catch (error) {
        console.error('Error during sign-out:', error);
        }
    }
  };

  const renderAuthButton = () => {
    if (isUserLoading) {
      return <Button variant="ghost" size="icon" disabled><Loader2 className="h-6 w-6 animate-spin" /></Button>;
    }
    if (user) {
      const buttonTitle = user.isAnonymous ? "Logged in Anonymously" : user.email || "Logged In";
      return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden md:inline" title={buttonTitle}>{buttonTitle}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="h-6 w-6" />
            </Button>
        </div>
      );
    }
    return (
      <Button variant="ghost" onClick={handleLogin} title="Login Anonymously">
        <LogIn className="h-6 w-6 mr-2" /> Login
      </Button>
    );
  };

  return (
    <header className="p-4 border-b border-border flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-[150px] justify-start">
        {renderAuthButton()}
      </div>
      <h1 className="text-4xl text-foreground font-headline text-center">PersonaCraft AI</h1>
      <div className="flex items-center gap-2 min-w-[150px] justify-end">
        <SettingsDialog />
      </div>
    </header>
  );
}
