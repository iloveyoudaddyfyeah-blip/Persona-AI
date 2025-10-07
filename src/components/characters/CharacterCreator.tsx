
"use client";

import React, { useState, useRef } from 'react';
import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { createCharacterFromPhoto } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Focus } from 'lucide-react';
import Image from 'next/image';
import { useUser, useFirestore } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Character, GenerateCharacterFromFormInput } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';


function getCroppedImg(image: HTMLImageElement, crop: Crop, fileName: string): Promise<string> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return Promise.reject('Could not get canvas context');
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    resolve(canvas.toDataURL('image/jpeg'));
  });
}


export default function CharacterCreator() {
  const { dispatch } = useCharacter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [formState, setFormState] = useState<Partial<GenerateCharacterFromFormInput>>({
    name: '',
    intro: '',
    personality: '',
    welcomeMessage: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  
  // Image crop state
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [croppedPhotoDataUri, setCroppedPhotoDataUri] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);


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
      setCrop(undefined) // Reset crop state
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setIsCropModalOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async () => {
    if (imgRef.current && crop?.width && crop?.height) {
        try {
            const dataUrl = await getCroppedImg(imgRef.current, crop, 'newFile.jpeg');
            setCroppedPhotoDataUri(dataUrl);
            setIsCropModalOpen(false);
        } catch(e) {
            console.error("Error cropping image", e);
            toast({ variant: 'destructive', title: 'Could not crop image' });
        }
    }
  }


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.intro || !formState.personality || !formState.welcomeMessage) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill out all required fields.",
      });
      return;
    }
    if (!croppedPhotoDataUri) {
         toast({
            variant: "destructive",
            title: "Missing Photo",
            description: "Please upload and crop a photo for the character.",
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
        ...formState,
        photoDataUri: croppedPhotoDataUri,
      } as GenerateCharacterFromFormInput & {photoDataUri: string});
      
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
          name: formState.name,
          photoDataUri: croppedPhotoDataUri,
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
        description: `Say hello to ${formState.name}.`,
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
    <div className="flex items-center justify-center h-full p-4">
       <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Crop Your Image</DialogTitle>
          </DialogHeader>
          {imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              aspect={1}
            >
              <Image ref={imgRef} src={imgSrc} alt="Crop preview" width={800} height={600} />
            </ReactCrop>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCropComplete}>Save Crop</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card className="w-full max-w-3xl bg-card/80 backdrop-blur-sm">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <h1 className="text-4xl font-headline text-center mb-8">Create New Character</h1>
            
            <div className={formSectionClass}>
              <Label className={labelClass}>Character Photo*</Label>
              <div className="flex items-center gap-4 p-4 rounded-md border bg-secondary/30">
                {croppedPhotoDataUri ? 
                    <Image src={croppedPhotoDataUri} alt="Character photo" width={80} height={80} className="rounded-md object-cover aspect-square" />
                    :
                    <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                }
                 <div className='flex-grow'>
                    <p className={descriptionClass}>Use [focus] to adjust the image to the best viewing angle.</p>
                     <DialogTrigger asChild>
                        <Button type='button' variant="outline" className="mt-2" onClick={() => document.getElementById('photo-upload')?.click() }>
                            <Focus className="mr-2" />
                            Focus
                        </Button>
                    </DialogTrigger>
                    <Input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} required className="hidden"/>
                 </div>
              </div>
            </div>

            <div className={formSectionClass}>
              <Label htmlFor="name" className={labelClass}>Name*</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formState.name}
                onChange={handleInputChange}
                placeholder="Provide a cool name for your character"
                required
                className="text-lg h-12 bg-secondary/30"
              />
            </div>
            
            <div className={formSectionClass}>
              <Label htmlFor="intro" className={labelClass}>Intro*</Label>
               <p className={descriptionClass}>This will be displayed in character cards and influence search, but won't affect how the character responds.</p>
              <Textarea
                id="intro"
                name="intro"
                value={formState.intro}
                onChange={handleInputChange}
                placeholder="A brief introduction for your character..."
                required
                className="text-lg min-h-[100px] bg-secondary/30"
              />
            </div>
            
            <div className={formSectionClass}>
              <Label htmlFor="personality" className={labelClass}>Personality*</Label>
              <p className={descriptionClass}>Describe your character's persona. This defines how the character interacts with others.</p>
              <Textarea
                id="personality"
                name="personality"
                value={formState.personality}
                onChange={handleInputChange}
                placeholder="e.g., Mysterious and witty, with a hidden past. They are fiercely loyal to their friends but slow to trust strangers."
                required
                className="text-lg min-h-[150px] bg-secondary/30"
              />
            </div>
            
            <div className={formSectionClass}>
                <Label htmlFor="welcomeMessage" className={labelClass}>Welcome Message*</Label>
                <p className={descriptionClass}>This sets the style the character will communicate. Provide a lengthy and engaging welcome message to encourage longer responses.</p>
                <Textarea
                    id="welcomeMessage"
                    name="welcomeMessage"
                    value={formState.welcomeMessage}
                    onChange={handleInputChange}
                    placeholder="The first thing your character says to a user."
                    required
                    className="text-lg min-h-[120px] bg-secondary/30"
                />
            </div>

            <Button type="submit" disabled={isGenerating} className="w-full text-xl h-14 font-bold tracking-wider" size="lg">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Create Character
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
