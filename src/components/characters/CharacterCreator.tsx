
"use client";

import React, { useState } from 'react';
import { useCharacter, Tone } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createCharacterFromPhoto } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { useUser, useFirestore } from '@/firebase';

export default function CharacterCreator() {
  const { state, dispatch } = useCharacter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<{ file: File; dataUri: string } | null>(null);
  const [charLimit, setCharLimit] = useState(state.settings.aiCharLimit);
  const [tone, setTone] = useState<Tone>(state.settings.aiTone);
  
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
    if (!user || !firestore) {
        toast({
            variant: "destructive",
            title: "Not logged in",
            description: "You must be logged in to create a character.",
        });
        return;
    }


    dispatch({ type: 'SET_IS_GENERATING', payload: true });

    try {
      const newCharacter = await createCharacterFromPhoto(firestore, name, photo.dataUri, tone, charLimit, user.uid);
      
      // The onSnapshot listener will add the character to the state.
      // We just need to select it.
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
        description: (error as Error).message || "Could not create character. Please try again.",
      });
    } finally {
      dispatch({ type: 'SET_IS_GENERATING', payload: false });
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Create New Character</CardTitle>
          <CardDescription>Give your new character a name, a face, and a personality blueprint.</CardDescription>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tone" className="text-xl">AI Tone</Label>
                 <Select value={tone} onValueChange={(value) => setTone(value as Tone)}>
                    <SelectTrigger className="text-lg">
                        <SelectValue placeholder="Select a tone" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="witty">Witty</SelectItem>
                        <SelectItem value="serious">Serious</SelectItem>
                        <SelectItem value="whimsical">Whimsical</SelectItem>
                        <SelectItem value="poetic">Poetic</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="char-limit" className="text-xl">Biography Length</Label>
                <div className='flex items-center gap-4'>
                    <Slider
                        id="char-limit"
                        min={500}
                        max={5000}
                        step={100}
                        value={[charLimit]}
                        onValueChange={(value) => setCharLimit(value[0])}
                    />
                    <span className='text-lg font-mono w-20 text-center'>{charLimit}</span>
                </div>
              </div>
            </div>
            <Button type="submit" disabled={state.isGenerating} className="w-full text-xl h-12">
              {state.isGenerating ? (
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
