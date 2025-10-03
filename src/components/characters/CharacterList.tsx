
"use client";

import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, User } from 'lucide-react';

export default function CharacterList() {
  const { state, dispatch } = useCharacter();

  const handleSelectCharacter = (id: string) => {
    dispatch({ type: 'SELECT_CHARACTER', payload: id });
  };

  const handleNewCharacter = () => {
    dispatch({ type: 'SET_VIEW', payload: 'creating' });
    dispatch({ type: 'SELECT_CHARACTER', payload: null });
  };
  
  const handleDeleteCharacter = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this character? This cannot be undone.')) {
      dispatch({ type: 'DELETE_CHARACTER', payload: id });
    }
  };


  return (
    <div className="bg-card/50 h-full flex flex-col p-4 rounded-lg border">
      <h2 className="text-2xl font-headline mb-4">Characters</h2>
      <div className="flex-grow overflow-y-auto pr-2 space-y-2">
        {state.characters.map(char => (
          <Button
            key={char.id}
            variant={state.selectedCharacterId === char.id ? 'secondary' : 'ghost'}
            className="w-full justify-start text-lg h-12"
            onClick={() => handleSelectCharacter(char.id)}
          >
            <User className="mr-2 h-5 w-5" />
            <span className="truncate flex-grow text-left">{char.name}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleDeleteCharacter(e, char.id)}>
              <Trash2 className="h-4 w-4 text-destructive/70" />
            </Button>
          </Button>
        ))}
      </div>
      <Button onClick={handleNewCharacter} className="mt-4 text-lg h-12">
        <Plus className="mr-2 h-5 w-5" /> New Character
      </Button>
    </div>
  );
}
