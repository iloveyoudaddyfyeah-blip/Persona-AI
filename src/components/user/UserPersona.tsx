
"use client";

import React, { useState, useEffect } from 'react';
import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Save, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { generatePersonaFromPrompt } from '@/app/actions';

export default function UserPersona() {
  const { state, dispatch } = useCharacter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [persona, setPersona] = useState(state.userPersona);
  const [regenPrompt, setRegenPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
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
        const userRef = doc(firestore, `users/${user.uid}`);
        updateDocumentNonBlocking(userRef, { persona });
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

  const handleRegenerate = async () => {
    if (!regenPrompt) {
      toast({ variant: "destructive", title: "Prompt is empty", description: "Please provide instructions for your persona." });
      return;
    }
    setIsRegenerating(true);
    try {
      const newPersona = await generatePersonaFromPrompt(regenPrompt);
      setPersona(newPersona);
      setRegenPrompt('');
      toast({ title: 'Persona Generated!', description: 'Your new persona is ready. You can edit it further or save it.' });
    } catch (error) {
      toast({ variant: "destructive", title: "Generation Failed", description: (error as Error).message });
    } finally {
      setIsRegenerating(false);
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
        <CardFooter className="flex-col items-start gap-4 border-t pt-6">
             <div className='flex w-full justify-between items-end'>
                 <div className='w-full pr-4'>
                    <Label htmlFor="regen-prompt" className="text-xl">Generate with AI</Label>
                    <div className='flex w-full gap-2 mt-2'>
                        <Input
                            id="regen-prompt"
                            placeholder="e.g., 'A witty space pirate with a heart of gold'"
                            value={regenPrompt}
                            onChange={(e) => setRegenPrompt(e.target.value)}
                            className="text-lg"
                            disabled={isRegenerating}
                        />
                        <Button onClick={handleRegenerate} className="text-lg h-12" disabled={isRegenerating}>
                            {isRegenerating ? (
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-6 w-6" />
                            )}
                            Generate
                        </Button>
                    </div>
                </div>
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
