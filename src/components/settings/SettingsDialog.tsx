
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Slider } from "../ui/slider";
import { useCharacter, Tone } from "@/context/CharacterContext";
import { Settings, Bug } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

export default function SettingsDialog() {
  const { state, dispatch } = useCharacter();
  const { settings } = state;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSettingChange = (key: string, value: any) => {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "You must be logged in to change settings.",
      });
      return;
    }

    const updatedSettings = { ...settings, [key]: value };
    
    // Dispatch to update local state immediately
    if (key === 'aiTone') {
        dispatch({ type: 'SET_AI_TONE', payload: value as Tone });
    } else if (key === 'aiCharLimit') {
        dispatch({ type: 'SET_AI_CHAR_LIMIT', payload: value });
    }

    // Save to Firestore
    const userRef = doc(firestore, `users/${user.uid}`);
    setDocumentNonBlocking(userRef, { settings: updatedSettings }, { merge: true });
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-6 w-6" />
          <span className="sr-only">Open Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage AI generation settings. These are saved to your account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div className="space-y-2">
                <Label htmlFor="tone" className="text-base flex items-center gap-2">Default AI Tone</Label>
                <Select 
                    value={settings.aiTone} 
                    onValueChange={(value) => handleSettingChange('aiTone', value)}
                >
                    <SelectTrigger className="text-base">
                        <SelectValue placeholder="Select a tone" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="witty">Witty</SelectItem>
                        <SelectItem value="serious">Serious</SelectItem>
                        <SelectItem value="whimsical">Whimsical</SelectItem>
                        <SelectItem value="poetic">Poetic</SelectItem>
                        <SelectItem value="epic">Epic</SelectItem>
                        <SelectItem value="noir">Noir</SelectItem>
                        <SelectItem value="comedic">Comedic</SelectItem>
                        <SelectItem value="dramatic">Dramatic</SelectItem>
                        <SelectItem value="sarcastic">Sarcastic</SelectItem>
                        <SelectItem value="inspirational">Inspirational</SelectItem>
                        <SelectItem value="melancholic">Melancholic</SelectItem>
                        <SelectItem value="cynical">Cynical</SelectItem>
                        <SelectItem value="optimistic">Optimistic</SelectItem>
                        <SelectItem value="philosophical">Philosophical</SelectItem>
                        <SelectItem value="existential">Existential</SelectItem>
                        <SelectItem value="stoic">Stoic</SelectItem>
                        <SelectItem value="lovecraftian">Lovecraftian</SelectItem>
                        <SelectItem value="shakespearean">Shakespearean</SelectItem>
                        <SelectItem value="hemingway-esque">Hemingway-esque</SelectItem>
                        <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                        <SelectItem value="steampunk">Steampunk</SelectItem>
                        <SelectItem value="high-fantasy">High Fantasy</SelectItem>
                        <SelectItem value="gritty-realism">Gritty Realism</SelectItem>
                        <SelectItem value="absurdist">Absurdist</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="char-limit" className="text-base flex items-center gap-2">Default Profile Length</Label>
                <div className='flex items-center gap-4'>
                    <Slider
                        id="char-limit"
                        min={500}
                        max={5000}
                        step={100}
                        value={[settings.aiCharLimit]}
                        onValueChange={(value) => handleSettingChange('aiCharLimit', value[0])}
                    />
                    <span className='text-base font-mono w-20 text-center'>{settings.aiCharLimit}</span>
                </div>
              </div>
        </div>
        <DialogFooter>
          <Button asChild variant="link">
            <a href="mailto:calebliskey51@gmail.com">
              <Bug className="mr-2 h-4 w-4" />
              Report a Bug
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
