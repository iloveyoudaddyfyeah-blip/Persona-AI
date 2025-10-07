
"use client";

import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Pencil, Copy, Trash2, History, Play, Shuffle } from 'lucide-react';
import { Textarea } from '../ui/textarea';
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
  onEdit: (newContent: string) => void;
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


export default function ChatMessage({ message, characterPhoto, characterName, personaPhoto, isLastMessage, isTyping, onEdit, onRewind, onContinue, onRegenerate, onDelete, isNotLastAIMessage }: ChatMessageProps) {
  const isCharacter = message.role === 'character';
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    setEditedContent(message.content);
  }, [message.content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing, editedContent]);
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
    if(textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${e.target.scrollHeight}px`;
    }
  }

  const handleSave = () => {
    if (editedContent.trim() && editedContent !== message.content) {
      onEdit(editedContent);
    }
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

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
         <DropdownMenu onOpenChange={(open) => { if (!open && isEditing) handleSave()}}>
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
                    {isEditing ? (
                        <Textarea
                            ref={textareaRef}
                            value={editedContent}
                            onChange={handleContentChange}
                            onKeyDown={handleKeyDown}
                            onBlur={handleSave}
                            className="text-lg bg-background/80 resize-none overflow-hidden w-full min-w-[300px]"
                            autoComplete="off"
                        />
                    ) : (
                        <FormattedContent content={message.content} isCharacter={isCharacter} />
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isCharacter ? 'start' : 'end'} className="w-48">
                <DropdownMenuItem onSelect={() => setIsEditing(true)} className="text-base py-2">
                    <Pencil className="mr-2 h-5 w-5" />
                    <span>Edit</span>
                </DropdownMenuItem>
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
