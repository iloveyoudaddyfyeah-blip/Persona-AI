
"use client";

import React, { useState, useEffect } from 'react';
import type { Character } from '@/lib/types';
import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CharacterProfileProps {
  character: Character;
}

export default function CharacterProfile({ character }: CharacterProfileProps) {
  const { dispatch } = useCharacter();
  const { toast } = useToast();
  const [name, setName] = useState(character.name);
  const [profile, setProfile] = useState(character.profile);

  useEffect(() => {
    setName(character.name);
    setProfile(character.profile);
  }, [character]);

  const handleSave = () => {
    const updatedCharacter: Character = { ...character, name, profile };
    dispatch({ type: 'UPDATE_CHARACTER', payload: updatedCharacter });
    toast({
      title: 'Character Saved',
      description: `${name}'s profile has been updated.`,
    });
  };

  const hasChanges = name !== character.name || profile !== character.profile;

  return (
    <Card className="flex-grow flex flex-col">
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
        {hasChanges && (
            <Button onClick={handleSave} className="self-end text-lg h-12">
                <Save className="mr-2 h-5 w-5"/>
                Save Changes
            </Button>
        )}
      </CardContent>
    </Card>
  );
}
