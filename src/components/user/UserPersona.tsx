
"use client";

import React, { useState, useEffect } from 'react';
import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserPersona } from '@/app/actions';
import { useUser, useFirestore } from '@/firebase';

export default function UserPersona() {
  const { state, dispatch } = useCharacter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [persona, setPersona] = useState(state.userPersona);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPersona(state.userPersona);
  }, [state.userPersona]);

  const handleSave = async () => {
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Not logged in', description: 'You must be logged in to save your persona.' });
        return;
    }
    setIsSaving(true);
    try {
        await updateUserPersona(firestore, user.uid, persona);
        dispatch({ type: 'SET_USER_PERSONA', payload: persona });
        toast({
        title: 'Persona Saved',
        description: `Your persona has been updated. Characters will now react to this new persona.`,
        });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Save Failed', description: (error as Error).message });
    } finally {
        setIsSaving(false);
    }
  };

  const hasChanges = persona !== state.userPersona;

  return (
    <Card className="h-full flex flex-col border-0 shadow-none rounded-t-none">
        <CardHeader>
            <CardTitle className="text-3xl font-headline">Your Persona</CardTitle>
            <CardDescription>
                This is how the AI characters will see you. Describe your personality, your role, or how you want to be perceived in your conversations. This is saved to your account.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4">
            <Textarea
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="e.g., A hardened detective looking for clues, a friendly traveler asking for stories..."
                className="flex-grow text-lg resize-none"
            />
        </CardContent>
        <CardFooter className="flex justify-end">
            {hasChanges && (
                <Button onClick={handleSave} className="text-lg h-12" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Save className="mr-2 h-5 w-5"/>}
                    Save Persona
                </Button>
            )}
        </CardFooter>
    </Card>
  );
}
