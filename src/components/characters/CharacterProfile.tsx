
"use client";

import React, { useState, useEffect } from 'react';
import type { Character } from '@/lib/types';
import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Loader2, Save, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { regenerateCharacterProfile } from '@/app/actions';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface CharacterProfileProps {
  character: Character;
}

export default function CharacterProfile({ character }: CharacterProfileProps) {
  const { state, dispatch } = useCharacter();
  const { toast } = useToast();
  const [name, setName] = useState(character.name);
  const [profile, setProfile] = useState(character.profile);
  const [regenPrompt, setRegenPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    setName(character.name);
    setProfile(character.profile);
  }, [character]);

  const handleSave = () => {
    // Note: profileData is not updated on manual edits, only on regeneration.
    const updatedCharacter: Character = { ...character, name, profile };
    dispatch({ type: 'UPDATE_CHARACTER', payload: updatedCharacter });
    toast({
      title: 'Character Saved',
      description: `${name}'s profile has been updated.`,
    });
  };

  const handleRegenerate = async () => {
    if (!regenPrompt) {
      toast({
        variant: "destructive",
        title: "Prompt is empty",
        description: "Please provide instructions for regeneration.",
      });
      return;
    }
    setIsRegenerating(true);
    dispatch({ type: 'SET_IS_GENERATING', payload: true });
    try {
      if (!character.profileData) {
        throw new Error("Character profile data is missing. Cannot regenerate.");
      }
      const { profile: newProfile, profileData: newProfileData } = await regenerateCharacterProfile(name, character.profileData, regenPrompt);
      const updatedCharacter: Character = { ...character, name, profile: newProfile, profileData: newProfileData };
      dispatch({ type: 'UPDATE_CHARACTER', payload: updatedCharacter });
      setProfile(newProfile); // update local state
      setRegenPrompt('');
      toast({
        title: 'Profile Regenerated!',
        description: `${name}'s profile has been updated based on your prompt.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Regeneration Failed",
        description: "Could not regenerate profile. Please try again.",
      });
    } finally {
      setIsRegenerating(false);
      dispatch({ type: 'SET_IS_GENERATING', payload: false });
    }
  };

  const hasChanges = name !== character.name || profile !== character.profile;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center gap-4">
        <Image src={character.photoDataUri} alt={character.name} width={100} height={100} className="rounded-lg border-2 pixel-art aspect-square object-cover" />
        <div className='w-full'>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-4xl font-headline bg-transparent outline-none w-full border-b border-transparent focus:border-foreground"
            />
          <p className="text-muted-foreground text-lg">Character Profile</p>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4">
        <Textarea
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
          placeholder="Character profile..."
          className="flex-grow text-lg resize-none"
        />
        <div className="flex justify-end gap-4">
          {hasChanges && (
              <Button onClick={handleSave} className="self-end text-lg h-12">
                  <Save className="mr-2 h-5 w-5"/>
                  Save Changes
              </Button>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
        <Label htmlFor="regen-prompt" className="text-xl">Refine with AI</Label>
        <div className='flex w-full gap-2'>
            <Input
              id="regen-prompt"
              placeholder="e.g., 'Make them more mysterious and give them a secret past.'"
              value={regenPrompt}
              onChange={(e) => setRegenPrompt(e.target.value)}
              className="text-lg"
              disabled={isRegenerating || state.isGenerating}
            />
            <Button onClick={handleRegenerate} className="text-lg h-12" disabled={isRegenerating || state.isGenerating}>
              {isRegenerating ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-6 w-6" />
              )}
              Regenerate
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
