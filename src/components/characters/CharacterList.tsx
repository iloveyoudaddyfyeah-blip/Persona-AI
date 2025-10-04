
"use client";

import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/firebase/auth';
import { deleteCharacterFromDb } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

export default function CharacterList() {
  const { state, dispatch } = useCharacter();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSelectCharacter = (id: string) => {
    dispatch({ type: 'SELECT_CHARACTER', payload: id });
  };

  const handleNewCharacter = () => {
    dispatch({ type: 'SET_VIEW', payload: 'creating' });
    dispatch({ type: 'SELECT_CHARACTER', payload: null });
  };
  
  const handleDeleteCharacter = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) {
        toast({ variant: 'destructive', title: 'Not logged in' });
        return;
    }
    if (window.confirm('Are you sure you want to delete this character? This cannot be undone.')) {
      try {
        await deleteCharacterFromDb(user.uid, id);
        // The snapshot listener in context will handle updating the local state
        toast({ title: 'Character deleted' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Delete failed', description: (error as Error).message });
      }
    }
  };


  return (
    <div className="bg-card/50 h-full flex flex-col p-4 rounded-lg border">
      <h2 className="text-2xl font-headline mb-4">Characters</h2>
      <div className="flex-grow overflow-y-auto pr-2 space-y-2">
        {state.characters.map(char => (
          <div
            key={char.id}
            onClick={() => handleSelectCharacter(char.id)}
            className={cn(
              "flex items-center w-full justify-start text-lg h-12 rounded-md cursor-pointer",
              state.selectedCharacterId === char.id ? "bg-secondary" : "hover:bg-accent/50"
            )}
          >
            <Button
              variant='ghost'
              className="flex-grow justify-start h-full text-lg hover:bg-transparent"
            >
              <User className="mr-2 h-5 w-5" />
              <span className="truncate flex-grow text-left">{char.name}</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 mr-2" onClick={(e) => handleDeleteCharacter(e, char.id)}>
              <Trash2 className="h-4 w-4 text-destructive/70" />
            </Button>
          </div>
        ))}
      </div>
      <Button onClick={handleNewCharacter} className="mt-4 text-lg h-12">
        <Plus className="mr-2 h-5 w-5" /> New Character
      </Button>
    </div>
  );
}
