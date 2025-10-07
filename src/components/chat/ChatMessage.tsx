
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
  isLastMessage: boolean;
  isTyping: boolean;
  onEdit: (newContent: string) => void;
  onRewind: () => void;
  onContinue: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  isNotLastAIMessage: boolean;
}

const FormattedContent = ({ content, isCharacter }: { content:string, isCharacter: boolean }) => {
  const regex = /(\*[^*]+\*)|("[^"]+")/g;
  const parts = content.split(regex).filter(Boolean);

  return (
    <div className="whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <em key={index} className="text-muted-foreground">
              {part.slice(1, -1)}
            </em>
          );
        }
        if (part.startsWith('"') && part.endsWith('"')) {
           return (
            <span key={index}>
              &quot;<span className={cn(isCharacter ? "text-accent" : "text-black dark:text-white")}>{part.slice(1, -1)}</span>&quot;
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};


export default function ChatMessage({ message, characterPhoto, characterName, isLastMessage, isTyping, onEdit, onRewind, onContinue, onRegenerate, onDelete, isNotLastAIMessage }: ChatMessageProps) {
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
        {isCharacter && (
          <Image
            src={characterPhoto}
            alt={characterName}
            title={characterName}
            width={40}
            height={40}
            className="rounded-full border-2 border-primary pixel-art object-cover aspect-square"
          />
        )}
         <DropdownMenu onOpenChange={(open) => { if (!open && isEditing) handleSave()}}>
            <DropdownMenuTrigger asChild>
                <div
                    className={cn(
                        "rounded-lg p-3 max-w-[75%] cursor-pointer",
                        isCharacter
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                    >
                    {isEditing ? (
                        <Textarea
                            ref={textareaRef}
                            value={editedContent}
                            onChange={handleContentChange}
                            onKeyDown={handleKeyDown}
                            onBlur={handleSave}
                            className="text-lg bg-background/80 resize-none overflow-hidden w-full min-w-[200px]"
                        />
                    ) : (
                        <FormattedContent content={message.content} isCharacter={isCharacter} />
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isCharacter ? 'start' : 'end'}>
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
