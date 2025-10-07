
"use client";

import { useCharacter } from '@/context/CharacterContext';
import Header from '@/components/layout/Header';
import CharacterList from '@/components/characters/CharacterList';
import CharacterCreator from '@/components/characters/CharacterCreator';
import CharacterProfile from '@/components/characters/CharacterProfile';
import WelcomeScreen from './WelcomeScreen';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import LoginScreen from './LoginScreen';
import UserPersonaManager from '@/components/user/UserPersonaManager';
import CreatePersona from '@/components/user/CreatePersona';
import EditPersona from '@/components/user/EditPersona';

export default function PersonaCraftClientPage() {
  const { state } = useCharacter();
  const { view, characters, selectedCharacterId, isGenerating, isLoading, selectedPersonaIdToEdit } = state;
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
        return <WelcomeScreen />; // Fallback if no character is selected
      case 'persona_manager':
        return <UserPersonaManager />;
      case 'creating_persona':
        return <CreatePersona />;
      case 'editing_persona':
        if (personaToEdit) {
            return <EditPersona persona={personaToEdit} />;
        }
        return <UserPersonaManager />; // Fallback
      case 'welcome':
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body text-xl">
      <Header />
      <div className="flex flex-grow min-h-0">
        <aside className="w-1/4 min-w-[300px] h-full p-4 hidden md:block sticky top-0">
          <CharacterList />
        </aside>
        <main className="flex-grow h-full p-4 overflow-y-auto">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}
