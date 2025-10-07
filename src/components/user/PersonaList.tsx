
"use client";

import React from 'react';
import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Pencil } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
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

export default function PersonaList() {
  const { state, dispatch } = useCharacter();
  const { user, firestore } = useUser();
  const { toast } = useToast();

  const handleSetActive = async (personaId: string) => {
    if (!user || !firestore || personaId === state.activePersonaId) return;

    if (state.activePersonaId) {
        const oldActiveRef = doc(firestore, `users/${user.uid}/personas/${state.activePersonaId}`);
        updateDocumentNonBlocking(oldActiveRef, { isActive: false });
    }
    
    const newActiveRef = doc(firestore, `users/${user.uid}/personas/${personaId}`);
    updateDocumentNonBlocking(newActiveRef, { isActive: true });

    const userRef = doc(firestore, `users/${user.uid}`);
    setDocumentNonBlocking(userRef, { activePersonaId: personaId }, { merge: true });

    toast({ title: "Active persona updated!" });
  };
  
  const handleDelete = (e: React.MouseEvent, personaId: string) => {
    e.stopPropagation();
    if (!user || !firestore) return;

    const personaRef = doc(firestore, `users/${user.uid}/personas/${personaId}`);
    deleteDocumentNonBlocking(personaRef);
    toast({ title: "Persona deleted." });

    if(state.activePersonaId === personaId) {
        const otherPersonas = state.userPersonas.filter(p => p.id !== personaId);
        if (otherPersonas.length > 0) {
            handleSetActive(otherPersonas[0].id);
        } else {
            dispatch({ type: 'SET_ACTIVE_PERSONA', payload: null });
        }
    }
  };
  
  const handleEditClick = (e: React.MouseEvent, personaId: string) => {
    e.stopPropagation();
    dispatch({ type: 'EDIT_PERSONA', payload: personaId });
  };


  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow overflow-y-auto space-y-2">
         {state.userPersonas.map(persona => (
            <div 
                key={persona.id} 
                className={cn(
                    "cursor-pointer hover:bg-secondary/50 transition-colors group relative flex items-center p-2 rounded-md",
                    state.activePersonaId === persona.id && "bg-primary/20"
                )}
                onClick={() => handleSetActive(persona.id)}
            >
                <Image 
                    src={persona.photoDataUri}
                    alt={persona.name}
                    width={40}
                    height={40}
                    className="rounded-md border object-cover aspect-square mr-3"
                    unoptimized
                />
                <div className="flex-grow">
                    <p className="font-medium truncate">{persona.name}</p>
                    {state.activePersonaId === persona.id && (
                        <span className="text-xs font-bold text-primary">ACTIVE</span>
                    )}
                </div>

                <div className="flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEditClick(e, persona.id)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => e.stopPropagation()}>
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
                                <AlertDialogCancel onClick={e => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={(e) => handleDelete(e, persona.id)}>
                                    Continue
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        ))}
      </div>
       <Button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'creating_persona' })} className="mt-4 text-lg h-12">
            <Plus className="mr-2 h-5 w-5" />
            New Persona
        </Button>
    </div>
  );
}
