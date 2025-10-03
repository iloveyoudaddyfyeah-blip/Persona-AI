import React from 'react';
import { ThemeToggle } from '../settings/ThemeToggle';
import SettingsDialog from '../settings/SettingsDialog';

export default function Header() {
  return (
    <header className="p-4 border-b border-border flex items-center justify-between">
      <div className="w-16"></div> {/* Spacer */}
      <h1 className="text-4xl text-foreground font-headline text-center">PersonaCraft AI</h1>
      <div className="flex items-center gap-2 w-16 justify-end">
        <SettingsDialog />
        <ThemeToggle />
      </div>
    </header>
  );
}
