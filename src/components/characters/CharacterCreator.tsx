
"use client";

import React, { useState } from 'react';
import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createCharacterFromPhoto } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import type { Character } from '@/lib/types';
import Image from 'next/image';

export default function CharacterCreator() {
  const { dispatch } = useCharacter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<{ file: File; dataUri: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit for GenAI
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload an image smaller than 4MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto({ file, dataUri: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !photo) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please provide a name and a photo.",
      });
      return;
    }

    setIsLoading(true);
    dispatch({ type: 'SET_IS_GENERATING', payload: true });

    try {
      const { profile, profileData } = await createCharacterFromPhoto(name, photo.dataUri);
      
      const newCharacter: Character = {
        id: crypto.randomUUID(),
        name,
        photoDataUri: photo.dataUri,
        profile,
        profileData,
        chatHistory: [],
      };

      dispatch({ type: 'ADD_CHARACTER', payload: newCharacter });
      dispatch({ type: 'SELECT_CHARACTER', payload: newCharacter.id });
      toast({
        title: "Character created!",
        description: `Say hello to ${name}.`,
      });

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not create character. Please try again.",
      });
    } finally {
      setIsLoading(false);
      dispatch({ type: 'SET_IS_GENERATING', payload: false });
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Create New Character</CardTitle>
          <CardDescription>Give your new character a name and a face.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xl">Character Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Alex"
                required
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo" className="text-xl">Photo</Label>
               <div className="flex items-center space-x-4">
                {photo && <Image src={photo.dataUri} alt="Preview" width={80} height={80} className="rounded-md border object-cover aspect-square" />}
                <div className="w-full">
                  <Input id="photo" type="file" accept="image/*" onChange={handleFileChange} required className="text-lg file:text-lg file:mr-4 file:py-2 file:px-4"/>
                </div>
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full text-xl h-12">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-6 w-6" />
                  Generate Character
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
