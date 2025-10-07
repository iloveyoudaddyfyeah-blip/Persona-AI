
"use client";

import React, { useState, useRef } from 'react';
import { useCharacter, Tone, Settings } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { createCharacterFromPhoto } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import { useUser, useFirestore } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Character } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';


export default function CharacterCreator() {
  const { state, dispatch } = useCharacter();
  const { settings } = state;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [instructions, setInstructions] = useState('');
  const [aiTone, setAiTone] = useState<Tone>(settings.aiTone);
  const [aiCharLimit, setAiCharLimit] = useState<number>(settings.aiCharLimit);

  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload an image smaller than 4MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoDataUri(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !photoDataUri) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please provide a name and photo for your character.",
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

    setIsGenerating(true);
    dispatch({ type: 'SET_IS_GENERATING', payload: true });

    try {
      // 1. Call server action to get AI-generated data
      const { profileData, profile, initialMessage } = await createCharacterFromPhoto({
        name,
        photoDataUri,
        tone: aiTone,
        charLimit: aiCharLimit,
        instructions,
      });
      
      const newCharacterId = doc(collection(firestore, 'users', user.uid, 'characters')).id;

      // Create a default first chat session
      const newChatId = uuidv4();
      const firstChatSession = {
        id: newChatId,
        name: `Chat 1`,
        createdAt: Date.now(),
        messages: [{ role: 'character' as const, content: initialMessage }],
      };
      
      const newCharacter: Character = {
          id: newCharacterId,
          name: name,
          photoDataUri: photoDataUri,
          profile: profile,
          profileData: profileData,
          chatSessions: [firstChatSession],
          activeChatId: newChatId,
      };

      // 2. Save the complete character object to Firestore from the client
      const characterRef = doc(firestore, `users/${user.uid}/characters/${newCharacterId}`);
      setDocumentNonBlocking(characterRef, newCharacter, { merge: false });
      
      // 3. Update the local state to show the new character.
      dispatch({ type: 'SELECT_CHARACTER', payload: newCharacter.id });
      dispatch({ type: 'SET_VIEW', payload: 'viewing' });
      
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
      setIsGenerating(false);
      dispatch({ type: 'SET_IS_GENERATING', payload: false });
    }
  };

  const formSectionClass = "space-y-3";
  const labelClass = "text-xl font-bold font-headline";
  const descriptionClass = "text-sm text-muted-foreground";

  return (
    <div className="w-full h-full overflow-y-auto py-8 px-4">
      <Card className="w-full max-w-3xl mx-auto bg-card/80 backdrop-blur-sm">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <header className="text-center">
              <h1 className="text-4xl font-headline mb-2">Create New Character</h1>
              <p className={descriptionClass}>Give your new character a name, a face, and a personality blueprint.</p>
            </header>

            <div className={formSectionClass}>
              <Label htmlFor="name" className={labelClass}>Character Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Alex"
                required
                className="text-lg h-12 bg-secondary/30"
              />
            </div>

            <div className={formSectionClass}>
              <Label className={labelClass}>Photo</Label>
              <div className="flex items-center gap-4 p-4 rounded-md border bg-secondary/30">
                {photoDataUri ? 
                    <Image src={photoDataUri} alt="Character photo" width={80} height={80} className="rounded-md object-cover aspect-square" />
                    :
                    <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                }
                 <div className='flex-grow'>
                    <p className={descriptionClass}>Upload a clear headshot for the best results.</p>
                    <Button type='button' variant="outline" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                        Choose File
                    </Button>
                    <Input id="photo-upload" ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} required className="hidden"/>
                 </div>
              </div>
            </div>
            
            <div className={formSectionClass}>
              <Label htmlFor="instructions" className={labelClass}>Additional Instructions (Optional)</Label>
               <p className={descriptionClass}>Guide the AI with specific details. e.g., 'Make them a secret agent', 'They are obsessed with collecting antique maps'</p>
              <Textarea
                id="instructions"
                name="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Add any specific instructions here..."
                className="text-lg min-h-[100px] bg-secondary/30"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div className={formSectionClass}>
                <Label htmlFor="tone" className={labelClass}>AI Tone</Label>
                <Select value={aiTone} onValueChange={(value) => setAiTone(value as Tone)}>
                  <SelectTrigger className="text-lg h-12 bg-secondary/30">
                      <SelectValue placeholder="Select a tone" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="joyful">Joyful</SelectItem>
                      <SelectItem value="anxious">Anxious</SelectItem>
                      <SelectItem value="angry">Angry</SelectItem>
                      <SelectItem value="serene">Serene</SelectItem>
                      <SelectItem value="passionate">Passionate</SelectItem>
                      <SelectItem value="apathetic">Apathetic</SelectItem>
                      <SelectItem value="fearful">Fearful</SelectItem>
                      <SelectItem value="hopeful">Hopeful</SelectItem>
                      <SelectItem value="jaded">Jaded</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="grumpy">Grumpy</SelectItem>
                      <SelectItem value="curious">Curious</SelectItem>
                      <SelectItem value="confident">Confident</SelectItem>
                      <SelectItem value="shy">Shy</SelectItem>
                      <SelectItem value="ambitious">Ambitious</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                      <SelectItem value="bitter">Bitter</SelectItem>
                      <SelectItem value="loving">Loving</SelectItem>
                      <SelectItem value="resentful">Resentful</SelectItem>
                      <SelectItem value="brave">Brave</SelectItem>
                      <SelectItem value="timid">Timid</SelectItem>
                      <SelectItem value="arrogant">Arrogant</SelectItem>
                      <SelectItem value="humble">Humble</SelectItem>
                      <SelectItem value="playful">Playful</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className={formSectionClass}>
                <Label htmlFor="char-limit" className={labelClass}>Overall Length</Label>
                <div className='flex items-center gap-4 pt-2'>
                    <Slider
                        id="char-limit"
                        min={1000}
                        max={10000}
                        step={100}
                        value={[aiCharLimit]}
                        onValueChange={(value) => setAiCharLimit(value[0])}
                    />
                    <span className='text-lg font-mono w-20 text-center'>{aiCharLimit}</span>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isGenerating} className="w-full text-xl h-14 font-bold tracking-wider" size="lg">
              {isGenerating ? (
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
