
"use client";

import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Users, UserSquare } from 'lucide-react';

export default function Sidebar() {
    const { dispatch } = useCharacter();

    const handleSetTab = (tab: 'characters' | 'personas') => {
        dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
        dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
    };

  return (
    <div className="bg-card h-full flex flex-col p-4 rounded-lg border">
        <div className="flex flex-col gap-2 mb-4">
            <Button onClick={() => handleSetTab('characters')} className="text-lg h-12 w-full">
                <UserSquare className="mr-2 h-5 w-5" /> Characters
            </Button>
            <Button onClick={() => handleSetTab('personas')} variant="outline" className="text-lg h-12 w-full">
                <Users className="mr-2 h-5 w-5" /> Manage Personas
            </Button>
        </div>
    </div>
  );
}
