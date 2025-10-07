
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { Textarea } from '../ui/textarea';
import type { UserPersona } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser } from '@/firebase/provider';
import { generateImageFromPrompt } from '@/app/actions';

interface EditPersonaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    persona: UserPersona;
}

export function EditPersonaDialog({ open, onOpenChange, persona }: EditPersonaDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [name, setName] = useState(persona.name);
  const [description, setDescription] = useState(persona.description);
  const [photoDataUri, setPhotoDataUri] = useState<string>(persona.photoDataUri);
  const [imagePrompt, setImagePrompt] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const personaPlaceholder = PlaceHolderImages.find(img => img.id === 'persona-placeholder');

  useEffect(() => {
    if (open) {
      setName(persona.name);
      setDescription(persona.description);
      setPhotoDataUri(persona.photoDataUri);
      setImagePrompt('');
    }
  }, [persona, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({ variant: "destructive", title: "File too large", description: "Image must be smaller than 4MB." });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => setPhotoDataUri(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt) {
        toast({ variant: "destructive", title: "Prompt is empty", description: "Please describe the image you want to generate." });
        return;
    }
    setIsGeneratingImage(true);
    try {
        const generatedUri = await generateImageFromPrompt(imagePrompt);
        setPhotoDataUri(generatedUri);
        toast({ title: "Image generated!" });
    } catch (error) {
        toast({ variant: "destructive", title: "Image generation failed", description: (error as Error).message });
    } finally {
        setIsGeneratingImage(false);
    }
  }

  const handleSave = async () => {
    if (!user || !firestore) return;
    if (!name || !description) {
        toast({ variant: 'destructive', title: 'Missing fields', description: 'Name and description are required.' });
        return;
    }

    setIsSaving(true);
    try {
        const personaRef = doc(firestore, `users/${user.uid}/personas/${persona.id}`);
        
        const updatedPersona: Partial<UserPersona> = {
            name,
            description,
            photoDataUri: photoDataUri || personaPlaceholder?.imageUrl || ''
        };

        updateDocumentNonBlocking(personaRef, updatedPersona);
        
        toast({ title: 'Persona updated!', description: `${name} has been saved.` });
        onOpenChange(false);
    } catch (error) {
        console.error("Error updating persona: ", error);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update persona. Check console for details.' });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">Edit Persona</DialogTitle>
          <DialogDescription>
            Refine your persona's details below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div className="space-y-2">
                <Label htmlFor="name" className="text-lg">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="text-lg" placeholder="e.g., The Investigator" />
            </div>

            <div className="space-y-4 rounded-lg border p-4">
                <Label className="text-lg">Persona Image</Label>
                <div className="flex items-center space-x-4">
                    <Image src={photoDataUri || personaPlaceholder?.imageUrl || ''} alt="Preview" width={80} height={80} className="rounded-md border object-cover aspect-square" data-ai-hint={personaPlaceholder?.imageHint} unoptimized/>
                    <div className="w-full space-y-2">
                        <Label htmlFor="edit-photo-upload">Upload an Image</Label>
                        <Input id="edit-photo-upload" type="file" accept="image/*" onChange={handleFileChange} className="text-lg file:text-lg file:mr-4 file:py-2 file:px-4"/>
                    </div>
                </div>

                <div className="flex items-center">
                    <div className="flex-grow border-t border-muted"></div>
                    <span className="mx-4 text-sm text-muted-foreground">OR</span>
                    <div className="flex-grow border-t border-muted"></div>
                </div>
                
                <div className="w-full space-y-2">
                    <Label htmlFor="edit-image-prompt">Generate an Image with AI</Label>
                     <div className="flex gap-2">
                        <Input id="edit-image-prompt" value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} className="text-lg" placeholder="e.g., A stoic warrior with a facial scar" />
                        <Button onClick={handleGenerateImage} disabled={isGeneratingImage} variant="secondary">
                            {isGeneratingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>

            </div>

             <div className="space-y-2">
                <Label htmlFor="description" className="text-lg">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="text-lg min-h-[100px]" placeholder="A short bio of your persona..." />
            </div>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : null}
                Save Changes
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
