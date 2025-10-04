
"use client";

import React, { useState, useEffect } from 'react';
import type { Character } from '@/lib/types';
import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Loader2, Save, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { regenerateCharacterProfile, saveCharacterChanges } from '@/app/actions';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatInterface from '../chat/ChatInterface';
import UserPersona from '../user/UserPersona';
import { useAuth } from '@/firebase/auth';

interface CharacterProfileProps {
  character: Character;
}

export default function CharacterProfile({ character }: CharacterProfileProps) {
  const { state, dispatch } = useCharacter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(character.name);
  const [profile, setProfile] = useState(character.profile);
  const [regenPrompt, setRegenPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(character.name);
    setProfile(character.profile);
  }, [character]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    const updatedCharacter: Character = { 
        ...character, 
        name, 
        profile,
    };
    try {
        await saveCharacterChanges(user.uid, updatedCharacter);
        // The snapshot listener will update the context state
        toast({
            title: 'Character Saved',
            description: `${name}'s profile has been updated.`,
        });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Save failed', description: (error as Error).message });
    } finally {
        setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!user) return;
    if (!regenPrompt) {
      toast({
        variant: "destructive",
        title: "Prompt is empty",
        description: "Please provide instructions for regeneration.",
      });
      return;
    }

    if (!character.profileData) {
         toast({
            variant: "destructive",
            title: "Missing Profile Data",
            description: "Cannot regenerate a profile that wasn't created with the new system.",
        });
        return;
    }

    setIsRegenerating(true);
    dispatch({ type: 'SET_IS_GENERATING', payload: true });
    try {
      await regenerateCharacterProfile(character, regenPrompt, user.uid);
      setRegenPrompt('');
      toast({
        title: 'Profile Regenerating!',
        description: `${name}'s profile is being updated. This may take a moment.`,
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Regeneration Failed",
        description: (error as Error).message || "Could not regenerate profile. Please try again.",
      });
    } finally {
      setIsRegenerating(false);
      dispatch({ type: 'SET_IS_GENERATING', payload: false });
    }
  };

  const hasChanges = name !== character.name || profile !== character.profile;

  return (
    <Tabs defaultValue="profile" className="h-full flex flex-col">
        <div className="flex-shrink-0 px-6 pt-6">
            <CardHeader className="flex flex-row items-center gap-4 p-0">
                <Image src={character.photoDataUri} alt={character.name} width={100} height={100} className="rounded-lg border-2 pixel-art aspect-square object-cover" />
                <div className='w-full'>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-4xl font-headline bg-transparent outline-none w-full border-b border-transparent focus:border-foreground"
                    />
                    <TabsList className="mt-2">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="chat">Chat</TabsTrigger>
                        <TabsTrigger value="persona">Your Persona</TabsTrigger>
                    </TabsList>
                </div>
            </CardHeader>
        </div>

        <TabsContent value="profile" className="flex-grow flex flex-col mt-0">
            <Card className="h-full flex flex-col border-0 shadow-none rounded-t-none">
                <CardContent className="flex-grow flex flex-col gap-4 pt-6">
                    <Textarea
                        value={profile}
                        onChange={(e) => setProfile(e.target.value)}
                        placeholder="Character profile..."
                        className="flex-grow text-lg resize-none"
                    />
                    <div className="flex justify-end gap-4">
                        {hasChanges && (
                            <Button onClick={handleSave} className="self-end text-lg h-12" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5"/>}
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
        </TabsContent>
        <TabsContent value="chat" className="flex-grow mt-0">
            <ChatInterface character={character} />
        </TabsContent>
         <TabsContent value="persona" className="flex-grow mt-0">
            <UserPersona />
        </TabsContent>
    </Tabs>
  );
}
