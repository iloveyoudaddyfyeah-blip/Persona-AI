
"use client";

import React from 'react';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Copy, Trash2, History, Play, Shuffle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChatMessageProps {
  message: ChatMessageType;
  characterPhoto: string;
  characterName: string;
  personaPhoto?: string | null;
  isLastMessage: boolean;
  isTyping: boolean;
  onRewind: () => void;
  onContinue: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  isNotLastAIMessage: boolean;
}

const EmphasizedText = ({ text }: { text: string }) => {
  const regex = /(\*[^*]+\*)/g;
  const parts = text.split(regex).filter(Boolean);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <strong key={index}>
              {part.slice(1, -1)}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  )
};


const FormattedContent = ({ content, isCharacter }: { content:string, isCharacter: boolean }) => {
  const regex = /(\*[^*]+\*)|("[^"]+")/g;
  const parts = content.split(regex).filter(Boolean);

  return (
    <div className="whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <em key={index} className={cn(
              isCharacter ? "ai-action-text" : "user-action-text"
            )}>
              {part.slice(1, -1)}
            </em>
          );
        }
        if (part.startsWith('"') && part.endsWith('"')) {
           return (
            <span key={index} className={cn(isCharacter ? "text-accent ai-quote" : "user-quote-text")}>
              <EmphasizedText text={part.slice(1, -1)} />
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};


export default function ChatMessage({ message, characterPhoto, characterName, personaPhoto, isLastMessage, isTyping, onRewind, onContinue, onRegenerate, onDelete, isNotLastAIMessage }: ChatMessageProps) {
  const isCharacter = message.role === 'character';
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast({
        title: "Copied to clipboard!",
    });
  }

  const showActionButtons = isCharacter && isLastMessage && !isTyping;
  const showRewindInMenu = isCharacter && isNotLastAIMessage;

  return (
    <div className={cn("flex flex-col gap-1 group", isCharacter ? 'items-start' : 'items-end')}>
       <div className={cn("flex w-full items-start gap-4 text-xl", isCharacter ? 'justify-start' : 'justify-end')}>
        {isCharacter ? (
          <Image
            src={characterPhoto}
            alt={characterName}
            title={characterName}
            width={40}
            height={40}
            className="rounded-full border-2 border-primary object-cover aspect-square"
          />
        ) : (
          personaPhoto && (
            <Image
              src={personaPhoto}
              alt={"Your persona"}
              title={"Your persona"}
              width={40}
              height={40}
              className="rounded-full border-2 border-secondary object-cover aspect-square order-2"
            />
          )
        )}
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div
                    className={cn(
                        "rounded-lg p-3 max-w-[75%] cursor-pointer",
                        isCharacter
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground",
                        !isCharacter && "order-1"
                    )}
                    >
                    <FormattedContent content={message.content} isCharacter={isCharacter} />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isCharacter ? 'start' : 'end'} className="w-48">
                <DropdownMenuItem onSelect={handleCopy} className="text-base py-2">
                    <Copy className="mr-2 h-5 w-5" />
                    <span>Copy</span>
                </DropdownMenuItem>
                {showRewindInMenu && (
                    <DropdownMenuItem onSelect={onRewind} className="text-base py-2">
                        <History className="mr-2 h-5 w-5" />
                        <span>Rewind to here</span>
                    </DropdownMenuItem>
                )}
                 {!isCharacter && isLastMessage && (
                    <DropdownMenuItem onSelect={onRegenerate} className="text-base py-2">
                        <Shuffle className="mr-2 h-5 w-5" />
                        <span>Regenerate AI Response</span>
                    </DropdownMenuItem>
                 )}
                <DropdownMenuItem onSelect={onDelete} className="text-destructive text-base py-2">
                    <Trash2 className="mr-2 h-5 w-5" />
                    <span>Delete</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

       <div className={cn("flex items-center gap-1 transition-opacity", 
        isCharacter ? 'pl-16' : 'pr-0',
        showActionButtons ? 'opacity-100' : 'opacity-0'
      )}>
            {showActionButtons && (
                <>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRegenerate} title="Regenerate">
                        <Shuffle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onContinue} title="Continue">
                        <Play className="h-4 w-4" />
                    </Button>
                </>
            )}
        </div>
    </div>
  );
}
