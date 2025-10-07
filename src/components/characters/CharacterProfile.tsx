
"use client";

import React, { useState, useEffect } from 'react';
import type { Character } from '@/lib/types';
import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Loader2, Save, Sparkles, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { regenerateCharacterProfile } from '@/app/actions';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatInterface from '../chat/ChatInterface';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface CharacterProfileProps {
  character: Character;
}

const FormattedProfile = ({ content }: { content: string }) => {
    const regex = /(\*\*[^*]+\*\*)/g;
    const parts = content.split(regex).filter(Boolean);

    return (
        <div className="whitespace-pre-wrap break-words text-lg leading-relaxed p-4 rounded-md bg-secondary/30 h-full text-muted-foreground">
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                        <strong key={index} className="font-bold text-xl inline-block text-gray-400">
                            {part.slice(2, -2)}
                        </strong>
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </div>
    );
};


export default function CharacterProfile({ character }: CharacterProfileProps) {
  const { state, dispatch } = useCharacter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [name, setName] = useState(character.name);
  const [profile, setProfile] = useState(character.profile);
  const [isEditing, setIsEditing] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(character.name);
    setProfile(character.profile);
    setIsEditing(false); // Reset editing state when character changes
  }, [character]);

  const handleSave = async () => {
    if (!user || !firestore) return;
    setIsSaving(true);
    try {
        const updatedCharacterData: Partial<Character> = { 
            name, 
            profile,
        };
        const characterRef = doc(firestore, `users/${user.uid}/characters/${character.id}`);
        updateDocumentNonBlocking(characterRef, updatedCharacterData);
        toast({
            title: 'Character Saved',
            description: `${name}'s profile has been updated.`,
        });
        setIsEditing(false);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Save failed', description: (error as Error).message });
    } finally {
        setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!user || !firestore) return;
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
      const { profile: newProfile, profileData: newProfileData } = await regenerateCharacterProfile(character, regenPrompt);
      
      const characterRef = doc(firestore, `users/${user.uid}/characters/${character.id}`);
      updateDocumentNonBlocking(characterRef, { profile: newProfile, profileData: newProfileData });

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

  const isRefineDisabled = isRegenerating || state.isGenerating || !character.profileData;

  return (
    <Tabs defaultValue="profile" className="h-full flex flex-col">
        <div className="flex-shrink-0 px-6 pt-6">
            <CardHeader className="flex flex-col items-start gap-4 p-0">
                <Button variant="ghost" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })} className="mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Characters
                </Button>
                <div className='flex flex-row items-center gap-4 w-full'>
                    <Image src={character.photoDataUri} alt={character.name} width={100} height={100} className="rounded-lg border-2 aspect-square object-cover" />
                    <div className='w-full'>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="text-4xl font-headline bg-transparent outline-none w-full border-b border-transparent focus:border-foreground"
                            autoComplete="off"
                        />
                        <TabsList className="mt-2">
                            <TabsTrigger value="profile">Profile</TabsTrigger>
                            <TabsTrigger value="chat">Chat</TabsTrigger>
                        </TabsList>
                    </div>
                </div>
            </CardHeader>
        </div>

        <TabsContent value="profile" className="flex-grow flex flex-col mt-0">
            <Card className="h-full flex flex-col border-0 shadow-none rounded-t-none">
                <CardContent className="flex-grow flex flex-col gap-4 pt-6">
                    {isEditing ? (
                        <Textarea
                            value={profile}
                            onChange={(e) => setProfile(e.target.value)}
                            placeholder="Character profile..."
                            className="flex-grow text-lg resize-none"
                            autoComplete="off"
                        />
                    ) : (
                       <FormattedProfile content={profile} />
                    )}
                    <div className="flex justify-end gap-4">
                        {(hasChanges || isEditing) && (
                            <Button onClick={handleSave} className="self-end text-lg h-12" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5"/>}
                                Save Changes
                            </Button>
                        )}
                         <Button onClick={() => setIsEditing(!isEditing)} variant="outline" className="self-end text-lg h-12">
                            {isEditing ? "Cancel" : "Edit Profile"}
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
                    <Label htmlFor="regen-prompt" className="text-xl flex items-center gap-2">Refine with AI</Label>
                    <div className='flex w-full gap-2'>
                        <Input
                            id="regen-prompt"
                            placeholder="e.g., 'Make them more mysterious and give them a secret past.'"
                            value={regenPrompt}
                            onChange={(e) => setRegenPrompt(e.target.value)}
                            className="text-lg"
                            disabled={isRefineDisabled}
                            autoComplete="off"
                        />
                        <Button onClick={handleRegenerate} className="text-lg h-12" disabled={isRefineDisabled}>
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
    </Tabs>
  );
}
