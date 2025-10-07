
"use client";

import React, { useState, useRef, useEffect } from 'react';
import type { Character, ChatSession, ChatMessage as ChatMessageType } from '@/lib/types';
import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChatMessage from './ChatMessage';
import { getChatResponse } from '@/app/actions';
import { Loader2, Plus, Send, Trash2, RotateCcw, RotateCw } from 'lucide-react';
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
import { v4 as uuidv4 } from 'uuid';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface ChatInterfaceProps {
  character: Character;
}

export default function ChatInterface({ character }: ChatInterfaceProps) {
  const { state, dispatch } = useCharacter();
  const { user, firestore } = useUser();
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const activePersona = state.userPersonas.find(p => p.id === state.activePersonaId) || null;
  const chatSessions = character.chatSessions || [];
  const activeChat = chatSessions.find(c => c.id === character.activeChatId);
  const chatHistory = activeChat?.messages || [];

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [activeChat, isTyping, chatHistory.length]);
  
  const handleNewChat = () => {
    if (!user || !firestore) return;
    const newChatId = uuidv4();
    const newChatSession: ChatSession = {
        id: newChatId,
        name: `Chat ${chatSessions.length + 1}`,
        createdAt: Date.now(),
        messages: [],
    };
    const updatedSessions = [...chatSessions, newChatSession];
    const characterRef = doc(firestore, `users/${user.uid}/characters/${character.id}`);
    updateDocumentNonBlocking(characterRef, { 
        chatSessions: updatedSessions,
        activeChatId: newChatId
    });
  };

  const handleSelectChat = (chatId: string) => {
    if (!user || !firestore) return;
    const characterRef = doc(firestore, `users/${user.uid}/characters/${character.id}`);
    updateDocumentNonBlocking(characterRef, { activeChatId: chatId });
  }

  const handleResetChat = () => {
    if (!user || !firestore || !activeChat) return;

    const updatedSessions = chatSessions.map(cs => 
        cs.id === activeChat.id ? { ...cs, messages: [] } : cs
    );

    const characterRef = doc(firestore, `users/${user.uid}/characters/${character.id}`);
    updateDocumentNonBlocking(characterRef, { chatSessions: updatedSessions });
  };
  
  const handleDeleteChat = () => {
    if (!user || !firestore || !character.activeChatId) return;

    const updatedSessions = chatSessions.filter(c => c.id !== character.activeChatId);
    let newActiveChatId: string | null = null;
    if (updatedSessions.length > 0) {
      // Sort by creation date and pick the latest one
      newActiveChatId = updatedSessions.sort((a,b) => b.createdAt - a.createdAt)[0].id;
    } else {
      // Or create a new one if all are deleted
      const newChatId = uuidv4();
      const firstChat: ChatSession = {
        id: newChatId,
        name: 'Chat 1',
        createdAt: Date.now(),
        messages: []
      };
      updatedSessions.push(firstChat);
      newActiveChatId = newChatId;
    }

    const characterRef = doc(firestore, `users/${user.uid}/characters/${character.id}`);
    updateDocumentNonBlocking(characterRef, { 
        chatSessions: updatedSessions,
        activeChatId: newActiveChatId
    });
  };

  const getAIResponse = async (messages: ChatMessageType[]) => {
    if (!user || !firestore || !activeChat) return;

    setIsTyping(true);
    try {
        const characterMessage = await getChatResponse(character, messages, activePersona);
        const finalMessages = [...messages, characterMessage];
        const finalSessions = chatSessions.map(cs => 
            cs.id === activeChat.id ? { ...cs, messages: finalMessages } : cs
        );
        const characterRef = doc(firestore, `users/${user.uid}/characters/${character.id}`);
        updateDocumentNonBlocking(characterRef, { chatSessions: finalSessions });
    } catch (error) {
        console.error("Error getting chat response:", (error as Error).message);
        const errorMessage = { role: 'character' as const, content: "I'm sorry, I'm having trouble thinking right now." };
        const finalMessages = [...messages, errorMessage];
        const finalSessions = chatSessions.map(cs => 
            cs.id === activeChat.id ? { ...cs, messages: finalMessages } : cs
        );
        const characterRef = doc(firestore, `users/${user.uid}/characters/${character.id}`);
        updateDocumentNonBlocking(characterRef, { chatSessions: finalSessions });
    } finally {
        setIsTyping(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isTyping || !user || !firestore || !activeChat) return;

    const userMessage = { role: 'user' as const, content: userInput };
    const updatedMessages = [...activeChat.messages, userMessage];
    
    setUserInput('');
    // Optimistically update the UI before waiting for the AI
    const updatedSessionsForUI = chatSessions.map(cs =>
      cs.id === activeChat.id ? { ...cs, messages: updatedMessages } : cs
    );
    dispatch({ type: 'UPDATE_CHARACTER', payload: { id: character.id, chatSessions: updatedSessionsForUI }});

    await getAIResponse(updatedMessages);
  };
  
  const handleEditMessage = async (index: number, newContent: string) => {
    if (!user || !firestore || !activeChat) return;

    const originalMessage = activeChat.messages[index];
    const newHistory = [...activeChat.messages];
    newHistory[index] = { ...newHistory[index], content: newContent };

    // Just update the message locally if it's an AI message
    if (originalMessage.role === 'character') {
      const updatedSessions = chatSessions.map(cs =>
        cs.id === activeChat.id ? { ...cs, messages: newHistory } : cs
      );
      // We only update firestore, the local state is updated via snapshot listener
      const characterRef = doc(firestore, `users/${user.uid}/characters/${character.id}`);
      updateDocumentNonBlocking(characterRef, { chatSessions: updatedSessions });
      return;
    }

    // If it's a user message, truncate and regenerate
    const truncatedHistory = newHistory.slice(0, index + 1);
    
    // Optimistically update UI
    const updatedSessionsForUI = chatSessions.map(cs =>
      cs.id === activeChat.id ? { ...cs, messages: truncatedHistory } : cs
    );
    dispatch({ type: 'UPDATE_CHARACTER', payload: { id: character.id, chatSessions: updatedSessionsForUI }});

    await getAIResponse(truncatedHistory);
  };

  const handleRewind = async (index: number) => {
    if (!user || !firestore || !activeChat) return;
    
    const newHistory = activeChat.messages.slice(0, index + 1);

    const updatedSessions = chatSessions.map(cs =>
      cs.id === activeChat.id ? { ...cs, messages: newHistory } : cs
    );
    // Optimistically update UI
    dispatch({ type: 'UPDATE_CHARACTER', payload: { id: character.id, chatSessions: updatedSessions }});

    const lastMessage = newHistory[newHistory.length - 1];
    if(lastMessage.role === 'user') {
       await getAIResponse(newHistory);
    }
  };

  const handleContinue = async () => {
    if (!user || !firestore || !activeChat) return;
    // An empty user message can signal the AI to continue.
    const continueMessage = { role: 'user' as const, content: '' };
    const currentHistory = activeChat.messages;
    await getAIResponse([...currentHistory, continueMessage]);
  };

  const handleRegenerate = async () => {
    if (!user || !firestore || !activeChat) return;

    const lastUserMessageIndex = chatHistory.slice().reverse().findIndex(m => m.role === 'user');
    if (lastUserMessageIndex === -1) return; // No user message to respond to

    const historyToRegen = chatHistory.slice(0, chatHistory.length - lastUserMessageIndex);

    // Optimistically remove AI responses from UI
    const updatedSessionsForUI = chatSessions.map(cs =>
      cs.id === activeChat.id ? { ...cs, messages: historyToRegen } : cs
    );
    dispatch({ type: 'UPDATE_CHARACTER', payload: { id: character.id, chatSessions: updatedSessionsForUI }});
    
    await getAIResponse(historyToRegen);
  };


  return (
    <Card className="flex flex-col h-full border-0 shadow-none rounded-t-none">
        <div className="p-4 border-b flex justify-between items-center">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="text-lg">
                        {activeChat?.name || "No Active Chat"}
                        <ChevronDown className="ml-2 h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Chat History</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {chatSessions.sort((a,b) => b.createdAt - a.createdAt).map(session => (
                        <DropdownMenuItem key={session.id} onSelect={() => handleSelectChat(session.id)} className={session.id === activeChat?.id ? 'bg-secondary' : ''}>
                           <div className="flex flex-col">
                                <span>{session.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    {format(new Date(session.createdAt), 'MMM d, yyyy h:mm a')}
                                </span>
                           </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
             <div className="flex gap-2">
                <Button onClick={handleNewChat} className="text-lg">
                    <Plus className="mr-2 h-5 w-5" />
                    New Chat
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="outline" className="text-lg" disabled={!activeChat || activeChat.messages.length === 0}>
                            <RotateCcw className="mr-2 h-5 w-5" />
                            Reset Chat
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all messages in the chat session "{activeChat?.name}". This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetChat}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive" className="text-lg" disabled={chatSessions.length <= 1}>
                            <Trash2 className="mr-2 h-5 w-5" />
                            Delete Chat
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the chat session "{activeChat?.name}". This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteChat}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
        <div ref={scrollAreaRef} className="flex-grow overflow-y-auto p-4 space-y-4">
            {chatHistory.map((msg, index) => (
                <ChatMessage 
                    key={index} 
                    message={msg} 
                    characterPhoto={character.photoDataUri} 
                    characterName={character.name}
                    isLastMessage={index === chatHistory.length - 1}
                    isTyping={isTyping}
                    onEdit={(newContent) => handleEditMessage(index, newContent)}
                    onRewind={() => handleRewind(index)}
                    onContinue={handleContinue}
                    onRegenerate={handleRegenerate}
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
             {!activeChat && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg">
                     <h3 className="text-2xl font-headline mb-2">No Chat Selected</h3>
                     <p className="text-muted-foreground mb-4">Create or select a chat to begin.</p>
                     <Button onClick={handleNewChat}>Start New Chat</Button>
                </div>
            )}
        </div>
        <div className="p-4 border-t flex flex-col gap-2">
            <div className="flex gap-2 items-center">
                <form onSubmit={handleSubmit} className="flex-grow flex gap-2">
                    <Input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={`Talk to ${character.name}...`}
                    className="text-lg"
                    disabled={isTyping || !user || !activeChat}
                    />
                    <Button type="submit" size="icon" className="h-12 w-12 flex-shrink-0" disabled={isTyping || !user || !activeChat}>
                        <Send className="h-6 w-6" />
                    </Button>
                </form>
            </div>
        </div>
    </Card>
  );
}
