
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
                        <SelectItem value="joyful">Joyful</SelectItem>
                        <SelectItem value="anxious">Anxious</SelectItem>
                        <SelectItem value="angry">Angry</SelectItem>
                        <SelectItem value="serene">Serene</SelectItem>
                        <SelectItem value="passionate">Passionate</SelectItem>
                        <SelectItem value="apathetic">Apathetic</SelectItem>
                        <SelectItem value="fearful">Fearful</SelectItem>
                        <SelectItem value="hopeful">Hopeful</SelectItem>
                        <SelectItem value="jaded">Jaded</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                        <SelectItem value="grumpy">Grumpy</SelectItem>
                        <SelectItem value="curious">Curious</SelectItem>
                        <SelectItem value="confident">Confident</SelectItem>
                        <SelectItem value="shy">Shy</SelectItem>
                        <SelectItem value="ambitious">Ambitious</SelectItem>
                        <SelectItem value="content">Content</SelectItem>
                        <SelectItem value="bitter">Bitter</SelectItem>
                        <SelectItem value="loving">Loving</SelectItem>
                        <SelectItem value="resentful">Resentful</SelectItem>
                        <SelectItem value="brave">Brave</SelectItem>
                        <SelectItem value="timid">Timid</SelectItem>
                        <SelectItem value="arrogant">Arrogant</SelectItem>
                        <SelectItem value="humble">Humble</SelectItem>
                        <SelectItem value="playful">Playful</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                        <SelectItem value="melancholy">Melancholy</SelectItem>
                        <SelectItem value="whimsical">Whimsical</SelectItem>
                        <SelectItem value="sarcastic">Sarcastic</SelectItem>
                        <SelectItem value="cynical">Cynical</SelectItem>
                        <SelectItem value="optimistic">Optimistic</SelectItem>
                        <SelectItem value="pessimistic">Pessimistic</SelectItem>
                        <SelectItem value="nervous">Nervous</SelectItem>
                        <SelectItem value="calm">Calm</SelectItem>
                        <SelectItem value="irritable">Irritable</SelectItem>
                        <SelectItem value="cheerful">Cheerful</SelectItem>
                        <SelectItem value="dramatic">Dramatic</SelectItem>
                        <SelectItem value="stoic">Stoic</SelectItem>
                        <SelectItem value="flirtatious">Flirtatious</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="informal">Informal</SelectItem>
                        <SelectItem value="witty">Witty</SelectItem>
                        <SelectItem value="pompous">Pompous</SelectItem>
                        <SelectItem value="insecure">Insecure</SelectItem>
                        <SelectItem value="nurturing">Nurturing</SelectItem>
                        <SelectItem value="distant">Distant</SelectItem>
                        <SelectItem value="methodical">Methodical</SelectItem>
                        <SelectItem value="chaotic">Chaotic</SelectItem>
                        <SelectItem value="mysterious">Mysterious</SelectItem>
                        <SelectItem value="direct">Direct</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="char-limit" className="text-base flex items-center gap-2">Default Profile Length</Label>
                <div className='flex items-center gap-4'>
                    <Slider
                        id="char-limit"
                        min={1000}
                        max={10000}
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
