"use client";

import React, { useState, useEffect } from 'react';
import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function UserPersona() {
  const { state } = useCharacter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const activePersona = state.userPersonas.find(p => p.isActive);
  const [description, setDescription] = useState(activePersona?.description || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDescription(activePersona?.description || '');
  }, [activePersona]);

  const handleSave = async () => {
    if (!user || !firestore || !activePersona) {
        toast({ variant: 'destructive', title: 'Not logged in or no active persona', description: 'You must be logged in and have an active persona to save.' });
        return;
    }
    setIsSaving(true);
    try {
        const personaRef = doc(firestore, `users/${user.uid}/personas/${activePersona.id}`);
        setDocumentNonBlocking(personaRef, { description }, { merge: true });
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

  const hasChanges = activePersona && description !== activePersona.description;

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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., A hardened detective looking for clues, a friendly traveler asking for stories..."
                className="flex-grow text-lg resize-none"
            />
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 border-t pt-6">
             <div className='flex w-full justify-end items-end'>
                {hasChanges && (
                    <Button onClick={handleSave} className="text-lg h-12 self-end" disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Save className="mr-2 h-5 w-5"/>}
                        Save Persona
                    </Button>
                )}
             </div>
        </CardFooter>
    </Card>
  );
}
