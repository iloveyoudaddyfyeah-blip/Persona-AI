
"use client";

import React, { useState, useRef, useEffect } from 'react';
import type { Character } from '@/lib/types';
import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChatMessage from './ChatMessage';
import { getChatResponse } from '@/app/actions';
import { Loader2, Send } from 'lucide-react';
import { Card } from '../ui/card';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface ChatInterfaceProps {
  character: Character;
}

export default function ChatInterface({ character }: ChatInterfaceProps) {
  const { state, dispatch } = useCharacter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [character.chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isTyping || !user || !firestore) return;

    const userMessage = { role: 'user' as const, content: userInput };
    // Optimistically update UI
    dispatch({ type: 'ADD_MESSAGE', payload: { characterId: character.id, message: userMessage } });
    setUserInput('');
    setIsTyping(true);

    try {
      const characterMessage = await getChatResponse(character, userInput, state.userPersona);
      
      const updatedHistory = [...(character.chatHistory || []), userMessage, characterMessage];
      const characterRef = doc(firestore, `users/${user.uid}/characters/${character.id}`);
      updateDocumentNonBlocking(characterRef, { chatHistory: updatedHistory });

    } catch (error) {
      console.error(error);
      const errorMessage = { role: 'character' as const, content: "I'm sorry, I'm having trouble thinking right now." };
      dispatch({ type: 'ADD_MESSAGE', payload: { characterId: character.id, message: errorMessage } });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Card className="flex flex-col h-full border-0 shadow-none rounded-t-none">
        <div ref={scrollAreaRef} className="flex-grow overflow-y-auto p-4 space-y-4 pt-6">
            {(character.chatHistory || []).map((msg, index) => (
                <ChatMessage key={index} message={msg} characterPhoto={character.photoDataUri} characterName={character.name} />
            ))}
            {isTyping && (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{character.name} is typing...</span>
                </div>
            )}
        </div>
        <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
            <Input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={`Talk to ${character.name}...`}
            className="text-lg"
            disabled={isTyping || !user}
            />
            <Button type="submit" size="icon" className="h-12 w-12 flex-shrink-0" disabled={isTyping || !user}>
              <Send className="h-6 w-6" />
            </Button>
      </form>
    </Card>
  );
}
