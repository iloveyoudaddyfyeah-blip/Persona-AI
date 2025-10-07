
"use client";

import { useCharacter } from '@/context/CharacterContext';
import Header from '@/components/layout/Header';
import CharacterCreator from '@/components/characters/CharacterCreator';
import CharacterProfile from '@/components/characters/CharacterProfile';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import LoginScreen from './LoginScreen';
import CreatePersona from '@/components/user/CreatePersona';
import EditPersona from '@/components/user/EditPersona';
import Dashboard from './Dashboard';
import type { DashboardTab } from './Dashboard';

export default function PersonaAIClientPage() {
  const { state } = useCharacter();
  const { view, characters, selectedCharacterId, isGenerating, isLoading, selectedPersonaIdToEdit, activeTab } = state;
  const { user, isUserLoading } = useUser();

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);
  const personaToEdit = state.userPersonas.find(p => p.id === selectedPersonaIdToEdit);

  if (isUserLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
          <Loader2 className="h-16 w-16 animate-spin mb-4" />
          <h2 className="text-3xl font-headline">Loading...</h2>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />;
  }

  const renderMainContent = () => {
    if (isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Loader2 className="h-16 w-16 animate-spin mb-4" />
                <h2 className="text-3xl font-headline">Crafting Persona...</h2>
                <p className="text-xl text-muted-foreground">This may take a moment.</p>
            </div>
        )
    }

    switch (view) {
      case 'creating':
        return <CharacterCreator />;
      case 'viewing':
        if (selectedCharacter) {
          return <CharacterProfile character={selectedCharacter} />;
        }
        return <Dashboard activeTab={activeTab} />; // Fallback
      case 'creating_persona':
        return <CreatePersona />;
      case 'editing_persona':
        if (personaToEdit) {
            return <EditPersona persona={personaToEdit} />;
        }
        return <Dashboard activeTab={activeTab} />; // Fallback
      case 'dashboard':
      default:
        return <Dashboard activeTab={activeTab} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body text-xl">
      <Header />
      <div className="flex flex-grow min-h-0">
        <main className="flex-grow h-full p-4 overflow-y-auto">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}
