
"use client";

import React, { useState, useEffect } from 'react';
import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UserPersona() {
  const { state, dispatch } = useCharacter();
  const { toast } = useToast();
  const [persona, setPersona] = useState(state.userPersona);

  useEffect(() => {
    setPersona(state.userPersona);
  }, [state.userPersona]);

  const handleSave = () => {
    dispatch({ type: 'SET_USER_PERSONA', payload: persona });
    toast({
      title: 'Persona Saved',
      description: `Your persona has been updated. Characters will now react to this new persona.`,
    });
  };

  const hasChanges = persona !== state.userPersona;

  return (
    <Card className="h-full flex flex-col border-0 shadow-none rounded-t-none">
        <CardHeader>
            <CardTitle className="text-3xl font-headline">Your Persona</CardTitle>
            <CardDescription>
                This is how the AI characters will see you. Describe your personality, your role, or how you want to be perceived in your conversations.
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
                <Button onClick={handleSave} className="text-lg h-12">
                    <Save className="mr-2 h-5 w-5"/>
                    Save Persona
                </Button>
            )}
        </CardFooter>
    </Card>
  );
}
