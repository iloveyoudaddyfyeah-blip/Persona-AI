
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "../ui/select";
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
                        <SelectGroup>
                          <SelectLabel>Fear & Insecurity</SelectLabel>
                          <SelectItem value="anxious">Anxious</SelectItem>
                          <SelectItem value="fearful">Fearful</SelectItem>
                          <SelectItem value="insecure">Insecure</SelectItem>
                          <SelectItem value="nervous">Nervous</SelectItem>
                          <SelectItem value="timid">Timid</SelectItem>
                          <SelectItem value="paranoid">Paranoid</SelectItem>
                          <SelectItem value="apprehensive">Apprehensive</SelectItem>
                          <SelectItem value="worried">Worried</SelectItem>
                          <SelectItem value="panicked">Panicked</SelectItem>
                          <SelectItem value="terrified">Terrified</SelectItem>
                          <SelectItem value="vulnerable">Vulnerable</SelectItem>
                          <SelectItem value="helpless">Helpless</SelectItem>
                          <SelectItem value="overwhelmed">Overwhelmed</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Brave & Heroic</SelectLabel>
                          <SelectItem value="brave">Brave</SelectItem>
                          <SelectItem value="heroic">Heroic</SelectItem>
                          <SelectItem value="confident">Confident</SelectItem>
                          <SelectItem value="valiant">Valiant</SelectItem>
                          <SelectItem value="daring">Daring</SelectItem>
                          <SelectItem value="fearless">Fearless</SelectItem>
                          <SelectItem value="courageous">Courageous</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                          <SelectItem value="gallant">Gallant</SelectItem>
                          <SelectItem value="indomitable">Indomitable</SelectItem>
                          <SelectItem value="resolute">Resolute</SelectItem>
                          <SelectItem value="steadfast">Steadfast</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Anger & Hostility</SelectLabel>
                          <SelectItem value="angry">Angry</SelectItem>
                          <SelectItem value="furious">Furious</SelectItem>
                          <SelectItem value="enraged">Enraged</SelectItem>
                          <SelectItem value="livid">Livid</SelectItem>
                          <SelectItem value="irate">Irate</SelectItem>
                          <SelectItem value="hostile">Hostile</SelectItem>
                          <SelectItem value="aggressive">Aggressive</SelectItem>
                          <SelectItem value="irritable">Irritable</SelectItem>
                          <SelectItem value="resentful">Resentful</SelectItem>
                          <SelectItem value="vengeful">Vengeful</SelectItem>
                          <SelectItem value="spiteful">Spiteful</SelectItem>
                          <SelectItem value="contemptuous">Contemptuous</SelectItem>
                          <SelectItem value="scornful">Scornful</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Joy & Happiness</SelectLabel>
                          <SelectItem value="joyful">Joyful</SelectItem>
                          <SelectItem value="cheerful">Cheerful</SelectItem>
                          <SelectItem value="ecstatic">Ecstatic</SelectItem>
                          <SelectItem value="elated">Elated</SelectItem>
                          <SelectItem value="jubilant">Jubilant</SelectItem>
                          <SelectItem value="gleeful">Gleeful</SelectItem>
                          <SelectItem value="euphoric">Euphoric</SelectItem>
                          <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                          <SelectItem value="radiant">Radiant</SelectItem>
                          <SelectItem value="lighthearted">Lighthearted</SelectItem>
                          <SelectItem value="effervescent">Effervescent</SelectItem>
                          <SelectItem value="exuberant">Exuberant</SelectItem>
                          <SelectItem value="playful">Playful</SelectItem>
                          <SelectItem value="goofy">Goofy</SelectItem>
                          <SelectItem value="whimsical">Whimsical</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Calm & Serene</SelectLabel>
                          <SelectItem value="serene">Serene</SelectItem>
                          <SelectItem value="calm">Calm</SelectItem>
                          <SelectItem value="seraphic">Seraphic</SelectItem>
                          <SelectItem value="tranquil">Tranquil</SelectItem>
                          <SelectItem value="placid">Placid</SelectItem>
                          <SelectItem value="peaceful">Peaceful</SelectItem>
                          <SelectItem value="composed">Composed</SelectItem>
                          <SelectItem value="halcyon">Halcyon</SelectItem>
                          <SelectItem value="unruffled">Unruffled</SelectItem>
                          <SelectItem value="sedate">Sedate</SelectItem>
                          <SelectItem value="restful">Restful</SelectItem>
                          <SelectItem value="content">Content</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Sadness & Melancholy</SelectLabel>
                          <SelectItem value="melancholy">Melancholy</SelectItem>
                          <SelectItem value="despondent">Despondent</SelectItem>
                          <SelectItem value="somber">Somber</SelectItem>
                          <SelectItem value="morose">Morose</SelectItem>
                          <SelectItem value="gloomy">Gloomy</SelectItem>
                          <SelectItem value="grief-stricken">Grief-stricken</SelectItem>
                          <SelectItem value="heartbroken">Heartbroken</SelectItem>
                          <SelectItem value="forlorn">Forlorn</SelectItem>
                          <SelectItem value="disconsolate">Disconsolate</SelectItem>
                          <SelectItem value="crestfallen">Crestfallen</SelectItem>
                          <SelectItem value="brooding">Brooding</SelectItem>
                          <SelectItem value="bitter">Bitter</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Detached & Apathetic</SelectLabel>
                          <SelectItem value="apathetic">Apathetic</SelectItem>
                          <SelectItem value="alienated">Alienated</SelectItem>
                          <SelectItem value="detached">Detached</SelectItem>
                          <SelectItem value="uninterested">Uninterested</SelectItem>
                          <SelectItem value="listless">Listless</SelectItem>
                          <SelectItem value="indifferent">Indifferent</SelectItem>
                          <SelectItem value="dispassionate">Dispassionate</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="distant">Distant</SelectItem>
                          <SelectItem value="reserved">Reserved</SelectItem>
                          <SelectItem value="stoic">Stoic</SelectItem>
                          <SelectItem value="jaded">Jaded</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Arrogance & Pride</SelectLabel>
                          <SelectItem value="arrogant">Arrogant</SelectItem>
                          <SelectItem value="haughty">Haughty</SelectItem>
                          <SelectItem value="conceited">Conceited</SelectItem>
                          <SelectItem value="pompous">Pompous</SelectItem>
                          <SelectItem value="smug">Smug</SelectItem>
                          <SelectItem value="pretentious">Pretentious</SelectItem>
                          <SelectItem value="imperious">Imperious</SelectItem>
                          <SelectItem value="domineering">Domineering</SelectItem>
                          <SelectItem value="boastful">Boastful</SelectItem>
                          <SelectItem value="self-righteous">Self-righteous</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Humility & Shyness</SelectLabel>
                          <SelectItem value="humble">Humble</SelectItem>
                          <SelectItem value="meek">Meek</SelectItem>
                          <SelectItem value="modest">Modest</SelectItem>
                          <SelectItem value="unassuming">Unassuming</SelectItem>
                          <SelectItem value="retiring">Retiring</SelectItem>
                          <SelectItem value="demure">Demure</SelectItem>
                          <SelectItem value="unpretentious">Unpretentious</SelectItem>
                          <SelectItem value="self-effacing">Self-effacing</SelectItem>
                          <SelectItem value="shy">Shy</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Other</SelectLabel>
                          <SelectItem value="passionate">Passionate</SelectItem>
                          <SelectItem value="hopeful">Hopeful</SelectItem>
                          <SelectItem value="ambitious">Ambitious</SelectItem>
                          <SelectItem value="curious">Curious</SelectItem>
                          <SelectItem value="sarcastic">Sarcastic</SelectItem>
                          <SelectItem value="cynical">Cynical</SelectItem>
                          <SelectItem value="optimistic">Optimistic</SelectItem>
                          <SelectItem value="pessimistic">Pessimistic</SelectItem>
                          <SelectItem value="dramatic">Dramatic</SelectItem>
                          <SelectItem value="flirtatious">Flirtatious</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                          <SelectItem value="informal">Informal</SelectItem>
                          <SelectItem value="witty">Witty</SelectItem>
                          <SelectItem value="nurturing">Nurturing</SelectItem>
                          <SelectItem value="methodical">Methodical</SelectItem>
                          <SelectItem value="chaotic">Chaotic</SelectItem>
                          <SelectItem value="mysterious">Mysterious</SelectItem>
                          <SelectItem value="direct">Direct</SelectItem>
                          <SelectItem value="dreamy">Dreamy</SelectItem>
                          <SelectItem value="stern">Stern</SelectItem>
                          <SelectItem value="grumpy">Grumpy</SelectItem>
                        </SelectGroup>
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
