
"use client";

import React from 'react';
import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Pencil, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import WelcomeScreen from '@/app/_components/WelcomeScreen';

export default function CharacterGrid() {
  const { state, dispatch } = useCharacter();
  const { characters } = state;
  const { user, firestore } = useUser();
  const { toast } = useToast();
  
  const handleDelete = (e: React.MouseEvent, characterId: string) => {
    e.stopPropagation();
    if (!user || !firestore) return;

    const characterRef = doc(firestore, `users/${user.uid}/characters/${characterId}`);
    deleteDocumentNonBlocking(characterRef);
    toast({ title: "Character deleted." });
  };
  
  const handleSelectCharacter = (characterId: string) => {
    dispatch({ type: 'SELECT_CHARACTER', payload: characterId });
  };
  
  const handleNewCharacter = () => {
    dispatch({ type: 'SET_VIEW', payload: 'creating' });
  };

  if (characters.length === 0) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex flex-col gap-4">
        <div className="flex justify-end items-center">
            <Button onClick={handleNewCharacter} size="lg" className="text-lg">
                <Plus className="mr-2 h-5 w-5" />
                New Character
            </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {characters.map(char => (
                <Card 
                    key={char.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow group relative flex flex-col overflow-hidden"
                    onClick={() => handleSelectCharacter(char.id)}
                >
                     <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 hover:bg-background" onClick={e => e.stopPropagation()}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will permanently delete the character "{char.name}". This cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={e => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={(e) => handleDelete(e, char.id)}>
                                        Continue
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden">
                        <Image 
                            src={char.photoDataUri}
                            alt={char.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                        />
                    </div>
                    <CardFooter className="p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent absolute bottom-0 left-0 right-0">
                       <div className="w-full">
                         <h3 className="text-xl font-bold text-white font-headline truncate">{char.name}</h3>
                         <p className="text-sm text-white/80 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            {char.chatSessions.reduce((total, session) => total + session.messages.length, 0)} messages
                         </p>
                       </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    </div>
  );
}
