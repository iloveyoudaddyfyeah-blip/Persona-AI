
"use client";

import { CharacterProvider, useCharacter } from '@/context/CharacterContext';
import Header from '@/components/layout/Header';
import CharacterList from '@/components/characters/CharacterList';
import CharacterCreator from '@/components/characters/CharacterCreator';
import CharacterProfile from '@/components/characters/CharacterProfile';
import ChatInterface from '@/components/chat/ChatInterface';
import WelcomeScreen from './WelcomeScreen';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { state } = useCharacter();
  const { view, characters, selectedCharacterId, isGenerating } = state;

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);

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
          return (
            <div className="flex flex-col h-full gap-4">
              <div className="flex-grow-[2] min-h-0">
                <CharacterProfile character={selectedCharacter} />
              </div>
              <div className="flex-grow-[1] min-h-0">
                <ChatInterface character={selectedCharacter} />
              </div>
            </div>
          );
        }
        return <WelcomeScreen />; // Fallback if no character is selected
      case 'welcome':
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body text-xl">
      <Header />
      <div className="flex flex-grow min-h-0">
        <aside className="w-1/4 min-w-[300px] h-full p-4 hidden md:block">
          <CharacterList />
        </aside>
        <main className="flex-grow h-full p-4">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}

export default function PersonaCraftClientPage() {
  return (
    <CharacterProvider>
      <AppContent />
    </CharacterProvider>
  );
}
