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
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Textarea } from '../ui/textarea';
import type { UserPersona } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser } from '@/firebase/provider';

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
  const [photo, setPhoto] = useState<{ file: File; dataUri: string } | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const personaPlaceholder = PlaceHolderImages.find(img => img.id === 'persona-placeholder');

  useEffect(() => {
    setName(persona.name);
    setDescription(persona.description);
    setPhoto(null);
  }, [persona]);

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
        };

        if (photo) {
            updatedPersona.photoDataUri = photo.dataUri;
        }

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
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-lg">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3 text-lg" placeholder="e.g., The Investigator" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="photo" className="text-right text-lg pt-2">Photo</Label>
                <div className="col-span-3 flex items-center space-x-4">
                    <Image src={photo?.dataUri || persona.photoDataUri || personaPlaceholder?.imageUrl || ''} alt="Preview" width={80} height={80} className="rounded-md border object-cover aspect-square" data-ai-hint={personaPlaceholder?.imageHint} unoptimized/>
                    <Input id="photo" type="file" accept="image/*" onChange={handleFileChange} className="text-lg file:text-lg file:mr-4 file:py-2 file:px-4"/>
                </div>
            </div>
             <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right text-lg pt-2">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3 text-lg min-h-[100px]" placeholder="A short bio of your persona..." />
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
