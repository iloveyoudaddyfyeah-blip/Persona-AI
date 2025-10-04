
"use client";

import React, { useState } from 'react';
import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { CreatePersonaDialog } from './CreatePersonaDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function UserPersonaManager() {
  const { state } = useCharacter();
  const { user, firestore } = useUser();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSetActive = async (personaId: string) => {
    if (!user || !firestore || personaId === state.activePersonaId) return;

    // 1. Deactivate old persona if there was one
    if (state.activePersonaId) {
        const oldActiveRef = doc(firestore, `users/${user.uid}/personas/${state.activePersonaId}`);
        updateDocumentNonBlocking(oldActiveRef, { isActive: false });
    }
    
    // 2. Set new persona to active
    const newActiveRef = doc(firestore, `users/${user.uid}/personas/${personaId}`);
    updateDocumentNonBlocking(newActiveRef, { isActive: true });


    // 3. Update the activePersonaId on the user document
    const userRef = doc(firestore, `users/${user.uid}`);
    setDocumentNonBlocking(userRef, { activePersonaId: personaId }, { merge: true });

    // The snapshot listener in context will handle the UI update.
    toast({ title: "Active persona updated!" });
  };
  
  const handleDelete = (personaId: string) => {
    if (!user || !firestore) return;

    const personaRef = doc(firestore, `users/${user.uid}/personas/${personaId}`);
    deleteDocumentNonBlocking(personaRef);
    toast({ title: "Persona deleted." });
  };


  return (
    <Card className="h-full flex flex-col border-0 shadow-none rounded-t-none">
        <CreatePersonaDialog 
            open={isDialogOpen} 
            onOpenChange={setIsDialogOpen}
            personaCount={state.userPersonas.length}
        />
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-3xl font-headline">Your Personas</CardTitle>
                    <CardDescription>
                        Manage your different personas. The active persona influences how AI characters interact with you.
                    </CardDescription>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} size="lg" className="text-lg">
                    <Plus className="mr-2 h-5 w-5" />
                    New Persona
                </Button>
            </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4">
            {state.userPersonas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg">
                     <h3 className="text-2xl font-headline mb-2">No Personas Yet</h3>
                     <p className="text-muted-foreground mb-4">Create your first persona to start interacting with characters.</p>
                     <Button onClick={() => setIsDialogOpen(true)}>Create a Persona</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {state.userPersonas.map(persona => (
                        <Card 
                            key={persona.id} 
                            className={cn(
                                "cursor-pointer hover:shadow-lg transition-shadow group relative",
                                state.activePersonaId === persona.id && "border-primary ring-2 ring-primary"
                            )}
                            onClick={() => handleSetActive(persona.id)}
                        >
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 flex-shrink-0 z-10 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will permanently delete the persona "{persona.name}". This cannot be undone.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(persona.id);
                                    }}>
                                        Continue
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <CardHeader className="flex-row gap-4 items-start pr-12">
                                <Image 
                                    src={persona.photoDataUri}
                                    alt={persona.name}
                                    width={64}
                                    height={64}
                                    className="rounded-md border object-cover aspect-square"
                                    unoptimized
                                />
                                <div className="flex-grow">
                                    <CardTitle className="text-xl">{persona.name}</CardTitle>
                                    {state.activePersonaId === persona.id && (
                                        <span className="text-xs font-bold text-primary bg-primary/20 px-2 py-1 rounded-full">ACTIVE</span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground line-clamp-3">{persona.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </CardContent>
    </Card>
  );
}
