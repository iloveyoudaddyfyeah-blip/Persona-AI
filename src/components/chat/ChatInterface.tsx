
"use client";

import React, { useState, useRef, useEffect } from 'react';
import type { Character } from '@/lib/types';
import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChatMessage from './ChatMessage';
import { getChatResponse } from '@/app/actions';
import { Loader2, Send, Trash2, Crown } from 'lucide-react';
import { Card } from '../ui/card';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { SubscriptionDialog } from '../settings/SubscriptionDialog';


interface ChatInterfaceProps {
  character: Character;
}

export default function ChatInterface({ character }: ChatInterfaceProps) {
  const { state, dispatch } = useCharacter();
  const { user, isPremium, setIsPremium } = useUser();
  const firestore = useFirestore();
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatHistory = character.chatHistory || [];

  const activePersona = state.userPersonas.find(p => p.id === state.activePersonaId) || null;

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [character.chatHistory, isTyping]);
  
  const handleClearChat = () => {
    if (!user || !firestore) return;
    const characterRef = doc(firestore, `users/${user.uid}/characters/${character.id}`);
    updateDocumentNonBlocking(characterRef, { chatHistory: [] });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isTyping || !user || !firestore) return;

    const userMessage = { role: 'user' as const, content: userInput };
    // Optimistically update UI with user message first
    const newHistoryWithUserMessage = [...(character.chatHistory || []), userMessage];
    dispatch({ type: 'UPDATE_CHARACTER', payload: { ...character, chatHistory: newHistoryWithUserMessage } });
    
    setUserInput('');
    setIsTyping(true);

    try {
      const characterMessage = await getChatResponse(character, userInput, activePersona, isPremium);
      
      const updatedHistory = [...newHistoryWithUserMessage, characterMessage];
      const characterRef = doc(firestore, `users/${user.uid}/characters/${character.id}`);
      updateDocumentNonBlocking(characterRef, { chatHistory: updatedHistory });

    } catch (error) {
      console.error(error);
      const errorMessage = { role: 'character' as const, content: "I'm sorry, I'm having trouble thinking right now." };
       const updatedHistory = [...newHistoryWithUserMessage, errorMessage];
       // Here we directly update the character in the context, which will then be picked up by the listener.
       // This might feel redundant, but it ensures the UI is updated even if the DB write has a delay.
      dispatch({ type: 'UPDATE_CHARACTER', payload: { ...character, chatHistory: updatedHistory } });
    } finally {
      setIsTyping(false);
    }
  };

  const isChatLocked = !isPremium && chatHistory.length >= 20;

  return (
    <Card className="flex flex-col h-full border-0 shadow-none rounded-t-none">
        <div ref={scrollAreaRef} className="flex-grow overflow-y-auto p-4 space-y-4 pt-6">
            {chatHistory.map((msg, index) => (
                <ChatMessage 
                    key={index} 
                    message={msg} 
                    characterPhoto={character.photoDataUri} 
                    characterName={character.name}
                    isLastMessage={index === chatHistory.length - 1}
                    isTyping={isTyping}
                />
            ))}
            {isTyping && (
                 <div className="flex items-start gap-4 text-xl justify-start">
                    <Image
                        src={character.photoDataUri}
                        alt={character.name}
                        width={40}
                        height={40}
                        className="rounded-full border-2 border-primary pixel-art object-cover aspect-square"
                    />
                    <div className="max-w-[75%] rounded-lg p-3 bg-secondary text-secondary-foreground flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{character.name} is typing...</span>
                    </div>
                </div>
            )}
        </div>
        <div className="p-4 border-t flex flex-col gap-2">
            {isChatLocked && (
                <Alert variant="destructive">
                    <Crown className="h-4 w-4" />
                    <AlertTitle>Chat Limit Reached</AlertTitle>
                    <AlertDescription className="flex justify-between items-center">
                        <div>
                            Free users have a 20-message limit. Upgrade for unlimited chat history.
                            You can also clear the history to start a new conversation.
                        </div>
                        <SubscriptionDialog onUpgrade={() => setIsPremium(true)}>
                          <Button size="sm">
                              <Crown className="mr-2 h-4 w-4" />
                              Upgrade
                          </Button>
                        </SubscriptionDialog>
                    </AlertDescription>
                </Alert>
            )}
            <div className="flex gap-2 items-center">
                <form onSubmit={handleSubmit} className="flex-grow flex gap-2">
                    <Input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={isChatLocked ? "Upgrade to continue chatting" : `Talk to ${character.name}...`}
                    className="text-lg"
                    disabled={isTyping || !user || isChatLocked}
                    />
                    <Button type="submit" size="icon" className="h-12 w-12 flex-shrink-0" disabled={isTyping || !user || isChatLocked}>
                        <Send className="h-6 w-6" />
                    </Button>
                </form>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-12 w-12 flex-shrink-0" disabled={isTyping || !user || chatHistory.length === 0}>
                            <Trash2 className="h-6 w-6" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the chat history for {character.name}. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearChat}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    </Card>
  );
}
