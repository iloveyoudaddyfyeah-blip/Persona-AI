
"use client";

import React, { useState, useRef, useEffect } from 'react';
import type { Character, ChatSession, ChatMessage as ChatMessageType } from '@/lib/types';
import { useCharacter } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChatMessage from './ChatMessage';
import { getChatResponse } from '@/app/actions';
import { Loader2, Plus, Send, Trash2, RotateCcw } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  character: Character;
}

export default function ChatInterface({ character }: ChatInterfaceProps) {
  const { state, dispatch } = useCharacter();
  const { user, firestore } = useUser();
  const { toast } = useToast();
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
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
  
  const handleNewChat = async () => {
    if (!user || !firestore || isSessionLoading || !character.initialMessage) return;
    setIsSessionLoading(true);
    try {
        const newChatId = uuidv4();
        const newChatSession: ChatSession = {
            id: newChatId,
            name: `Chat ${chatSessions.length + 1}`,
            createdAt: Date.now(),
            messages: [{ role: 'character', content: character.initialMessage }],
        };
        const updatedSessions = [...chatSessions, newChatSession];
        const characterRef = doc(firestore, `users/${user.uid}/characters/${character.id}`);
        updateDocumentNonBlocking(characterRef, { 
            chatSessions: updatedSessions,
            activeChatId: newChatId
        });
        toast({ title: "New chat created!"});
    } catch(e) {
        toast({ variant: 'destructive', title: "Could not create new chat." });
    } finally {
        setIsSessionLoading(false);
    }
  };

  const handleSelectChat = (chatId: string) => {
    if (!user || !firestore) return;
    const characterRef = doc(firestore, `users/${user.uid}/characters/${character.id}`);
    updateDocumentNonBlocking(characterRef, { activeChatId: chatId });
  }

  const handleResetChat = async () => {
    if (!user || !firestore || !activeChat || isSessionLoading || !character.initialMessage) return;
    setIsSessionLoading(true);
    try {
        const updatedSessions = chatSessions.map(cs => 
            cs.id === activeChat.id ? { ...cs, messages: [{ role: 'character', content: character.initialMessage! }] } : cs
        );

        const characterRef = doc(firestore, `users/${user.uid}/characters/${character.id}`);
        updateDocumentNonBlocking(characterRef, { chatSessions: updatedSessions });
        toast({ title: "Chat has been reset."});
    } catch(e) {
        toast({ variant: 'destructive', title: "Could not reset chat." });
    } finally {
        setIsSessionLoading(false);
    }
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
      handleNewChat();
      return;
    }

    const characterRef = doc(firestore, `users/${user.uid}/characters/${character.id}`);
    updateDocumentNonBlocking(characterRef, { 
        chatSessions: updatedSessions,
        activeChatId: newActiveChatId
    });
  };

  const getAIResponse = async (messages: ChatMessageType[]) => {
    if (!user || !firestore || !activeChat) return;
    if (messages.length === 0) {
        setIsTyping(false);
        return;
    };

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'character') {
      setIsTyping(false);
      return; // Don't respond to our own message
    }


    setIsTyping(true);
    try {
        const characterMessage = await getChatResponse(character, messages, activePersona);
        
        let finalMessages: ChatMessageType[];

        if(messages.at(-1)?.role === 'user' && messages.at(-1)?.content === '') {
          // This was a 'continue' request. We replace the empty user message with the new character message.
          finalMessages = [...messages.slice(0, -1), characterMessage];
        } else {
           finalMessages = [...messages, characterMessage];
        }

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

  const handleRewind = async (index: number) => {
    if (!user || !firestore || !activeChat) return;
    
    // We only ever rewind to just before an AI message. So we slice up to its index.
    const newHistory = activeChat.messages.slice(0, index);

    // Optimistically update UI
    const updatedSessions = chatSessions.map(cs =>
      cs.id === activeChat.id ? { ...cs, messages: newHistory } : cs
    );
    dispatch({ type: 'UPDATE_CHARACTER', payload: { id: character.id, chatSessions: updatedSessions }});

    // After rewinding, the last message should be a user message, so we can regenerate from it.
    if (newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'user') {
       await getAIResponse(newHistory);
    }
  };

  const handleDeleteMessage = async (index: number) => {
    if (!user || !firestore || !activeChat) return;

    const newHistory = activeChat.messages.filter((_, i) => i !== index);

    // Optimistically update UI
    const updatedSessionsForUI = chatSessions.map(cs =>
        cs.id === activeChat.id ? { ...cs, messages: newHistory } : cs
    );
    dispatch({ type: 'UPDATE_CHARACTER', payload: { id: character.id, chatSessions: updatedSessionsForUI }});
    
    // Persist the change
    const characterRef = doc(firestore, `users/${user.uid}/characters/${character.id}`);
    const finalSessions = chatSessions.map(cs =>
      cs.id === activeChat.id ? { ...cs, messages: newHistory } : cs
    );
    updateDocumentNonBlocking(characterRef, { chatSessions: finalSessions });

    // The AI does not need to re-run after a simple deletion. The conversation state is just... shorter.
  };


  const handleContinue = async () => {
    if (!user || !firestore || !activeChat || isTyping) return;
    // An empty user message signals the AI to continue.
    const continueMessage = { role: 'user' as const, content: '' };
    const currentHistory = activeChat.messages;
    const historyForAI = [...currentHistory, continueMessage];

    // Optimistically update the UI to show the typing indicator
    setIsTyping(true);

    await getAIResponse(historyForAI);
  };

  const handleRegenerate = async () => {
    if (!user || !firestore || !activeChat || isTyping) return;

    // Find the last message that isn't from the character.
    const lastUserMessageIndex = chatHistory.slice().reverse().findIndex(m => m.role === 'user');
    
    if (lastUserMessageIndex === -1) return; // No user message to respond to

    // The index in the original array
    const lastUserMessageActualIndex = chatHistory.length - 1 - lastUserMessageIndex;

    // Truncate the history to include only up to that last user message.
    const historyToRegen = chatHistory.slice(0, lastUserMessageActualIndex + 1);

    // Optimistically remove AI responses from UI
    const updatedSessionsForUI = chatSessions.map(cs =>
      cs.id === activeChat.id ? { ...cs, messages: historyToRegen } : cs
    );
    dispatch({ type: 'UPDATE_CHARACTER', payload: { id: character.id, chatSessions: updatedSessionsForUI }});
    
    await getAIResponse(historyToRegen);
  };


  return (
    <Card className="flex flex-col h-full border-0 shadow-none rounded-t-none">
        <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
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
                <Button onClick={handleNewChat} className="text-lg" disabled={isSessionLoading}>
                    {isSessionLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
                    New Chat
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="outline" className="text-lg" disabled={!activeChat || activeChat.messages.length === 0 || isSessionLoading}>
                            {isSessionLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RotateCcw className="mr-2 h-5 w-5" />}
                            Reset Chat
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all messages in the chat session "{activeChat?.name}" and start over with the character's introduction.
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
        <div ref={scrollAreaRef} className="flex-grow p-4 overflow-y-auto">
            <div className='space-y-4 pr-2'>
                {chatHistory.map((msg, index) => (
                    <ChatMessage 
                        key={`${activeChat?.id}-${index}`} 
                        message={msg} 
                        characterPhoto={character.photoDataUri} 
                        characterName={character.name}
                        personaPhoto={activePersona?.photoDataUri}
                        isLastMessage={index === chatHistory.length - 1}
                        isTyping={isTyping}
                        onRewind={() => handleRewind(index)}
                        onContinue={handleContinue}
                        onRegenerate={handleRegenerate}
                        onDelete={() => handleDeleteMessage(index)}
                        isNotLastAIMessage={msg.role === 'character' && index < chatHistory.length -1}
                    />
                ))}
                {isTyping && (
                    <div className="flex items-start gap-4 text-xl justify-start">
                        <Image
                            src={character.photoDataUri}
                            alt={character.name}
                            width={40}
                            height={40}
                            className="rounded-full border-2 border-primary object-cover aspect-square"
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
        </div>
        <div className="p-4 border-t flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={`Talk to ${character.name}...`}
                className="text-lg"
                disabled={isTyping || !user || !activeChat}
                autoComplete="off"
                />
                <Button type="submit" size="icon" className="h-12 w-12 flex-shrink-0" disabled={isTyping || !user || !activeChat}>
                    <Send className="h-6 w-6" />
                </Button>
            </form>
        </div>
    </Card>
  );
}

    