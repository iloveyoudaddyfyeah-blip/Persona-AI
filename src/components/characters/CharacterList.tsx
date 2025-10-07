"use client";

import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import Image from 'next/image';
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

export default function CharacterList() {
  const { state, dispatch } = useCharacter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSelectCharacter = (id: string) => {
    dispatch({ type: 'SELECT_CHARACTER', payload: id });
  };

  const handleNewCharacter = () => {
    dispatch({ type: 'SET_VIEW', payload: 'creating' });
    dispatch({ type: 'SELECT_CHARACTER', payload: null });
  };
  
  const handleDeleteCharacter = (id: string) => {
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Not logged in' });
        return;
    }
    try {
        const characterRef = doc(firestore, `users/${user.uid}/characters/${id}`);
        deleteDocumentNonBlocking(characterRef);
        // The snapshot listener in context will handle updating the local state
        toast({ title: 'Character deleted' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Delete failed', description: (error as Error).message });
    }
  };


  return (
    <div className="bg-card h-full flex flex-col p-4 rounded-lg border">
      <h2 className="text-2xl font-headline mb-4 px-2">Characters</h2>
      <div className="flex-grow overflow-y-auto pr-2 space-y-2">
        {state.characters.map(char => (
          <div
            key={char.id}
            onClick={() => handleSelectCharacter(char.id)}
            className={cn(
              "flex items-center w-full justify-between rounded-md cursor-pointer group",
              state.selectedCharacterId === char.id ? "bg-primary/20" : "hover:bg-secondary/50"
            )}
          >
            <div
              className="flex-grow flex items-center justify-start text-lg h-14 px-4 rounded-md"
            >
              <Image 
                src={char.photoDataUri} 
                alt={char.name}
                width={40}
                height={40}
                className="mr-3 h-10 w-10 rounded-md object-cover"
              />
              <span className="truncate flex-grow text-left font-medium">{char.name}</span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 mr-2 opacity-50 group-hover:opacity-100 transition-opacity">
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
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteCharacter(char.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>
      <Button onClick={handleNewCharacter} className="mt-4 text-lg h-12">
        <Plus className="mr-2 h-5 w-5" /> New Character
      </Button>
    </div>
  );
}
