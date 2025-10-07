
"use client";

import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import CharacterList from "../characters/CharacterList";

export default function Sidebar() {
    const { dispatch } = useCharacter();

    const handleNewCharacter = () => {
        dispatch({ type: 'SET_VIEW', payload: 'creating' });
        dispatch({ type: 'SELECT_CHARACTER', payload: null });
    };

    const handleManagePersonas = () => {
        dispatch({ type: 'SET_VIEW', payload: 'persona_manager' });
    };

  return (
    <div className="bg-card h-full flex flex-col p-4 rounded-lg border">
        <div className="flex flex-col gap-2 mb-4">
            <Button onClick={handleNewCharacter} className="text-lg h-12 w-full">
                <Plus className="mr-2 h-5 w-5" /> New Character
            </Button>
            <Button onClick={handleManagePersonas} variant="outline" className="text-lg h-12 w-full">
                <Users className="mr-2 h-5 w-5" /> Manage Personas
            </Button>
        </div>
        <div className="flex-grow overflow-y-auto mt-4 pr-2 border-t pt-4">
          <CharacterList />
        </div>
    </div>
  );
}
