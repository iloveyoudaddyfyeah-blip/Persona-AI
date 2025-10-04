
"use client";

import React, { useState } from 'react';
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
import { useUser } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { generatePersonaFromPrompt } from '@/app/actions';
import { Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { Textarea } from '../ui/textarea';
import type { UserPersona } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface CreatePersonaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    personaCount: number;
    isPremium: boolean;
}

export function CreatePersonaDialog({ open, onOpenChange, personaCount, isPremium }: CreatePersonaDialogProps) {
  const { user, firestore } = useUser();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<{ file: File; dataUri: string } | null>(null);
  const [genPrompt, setGenPrompt] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const personaPlaceholder = PlaceHolderImages.find(img => img.id === 'persona-placeholder');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({ variant: "destructive", title: "File too large", description: "Image must be smaller than 4MB." });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => setPhoto({ file, dataUri: event.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateDescription = async () => {
    if (!genPrompt) {
        toast({ variant: 'destructive', title: 'Prompt is empty' });
        return;
    }
    setIsGenerating(true);
    try {
        const generatedDesc = await generatePersonaFromPrompt(genPrompt);
        setDescription(generatedDesc);
        toast({ title: 'Description generated!' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Generation failed', description: (error as Error).message });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user || !firestore) return;
    if (!name || !description) {
        toast({ variant: 'destructive', title: 'Missing fields', description: 'Name and description are required.' });
        return;
    }

    if (!isPremium && personaCount >= 1) {
        toast({ variant: 'destructive', title: 'Premium Feature', description: 'Upgrade to create more than one persona.' });
        return;
    }


    setIsSaving(true);
    try {
        const newPersonaId = doc(collection(firestore, `users/${user.uid}/personas`)).id;
        
        // The first persona created is automatically set to active.
        const isActive = personaCount === 0;

        const newPersona: UserPersona = {
            id: newPersonaId,
            name,
            description,
            photoDataUri: photo?.dataUri || personaPlaceholder?.imageUrl || '',
            isActive: isActive,
        };

        const personaRef = doc(firestore, `users/${user.uid}/personas/${newPersonaId}`);
        // Corrected call: data is the second argument, options is the third
        setDocumentNonBlocking(personaRef, newPersona, { merge: false });

        if (isActive) {
            const userRef = doc(firestore, `users/${user.uid}`);
            setDocumentNonBlocking(userRef, { activePersonaId: newPersonaId }, { merge: true });
        }
        
        toast({ title: 'Persona created!', description: `${name} is now available.` });
        resetForm();
        onOpenChange(false);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Save failed', description: (error as Error).message });
    } finally {
        setIsSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPhoto(null);
    setGenPrompt('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        resetForm();
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Persona</DialogTitle>
          <DialogDescription>
            Craft a new persona for your interactions. Give it a name, a face, and a personality.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-lg">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3 text-lg" placeholder="e.g., The Investigator" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="photo" className="text-right text-lg pt-2">Photo</Label>
                <div className="col-span-3 flex items-center space-x-4">
                    <Image src={photo?.dataUri || personaPlaceholder?.imageUrl || ''} alt="Preview" width={80} height={80} className="rounded-md border object-cover aspect-square" data-ai-hint={personaPlaceholder?.imageHint} unoptimized/>
                    <Input id="photo" type="file" accept="image/*" onChange={handleFileChange} className="text-lg file:text-lg file:mr-4 file:py-2 file:px-4"/>
                </div>
            </div>
             <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right text-lg pt-2">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3 text-lg min-h-[100px]" placeholder="A short bio of your persona..." />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gen-prompt" className="text-right text-lg">Generate with AI</Label>
                <div className="col-span-3 flex gap-2">
                    <Input id="gen-prompt" value={genPrompt} onChange={(e) => setGenPrompt(e.target.value)} className="text-lg" placeholder="e.g., 'A grizzled space captain'" disabled={isGenerating} />
                    <Button onClick={handleGenerateDescription} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                        <span className="sr-only">Generate</span>
                    </Button>
                </div>
            </div>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : null}
                Save Persona
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
