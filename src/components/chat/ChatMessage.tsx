
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTypewriter } from '@/hooks/use-typewriter';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Pencil, Check, X, RotateCcw } from 'lucide-react';
import { Input } from '../ui/input';

interface ChatMessageProps {
  message: ChatMessageType;
  characterPhoto: string;
  characterName: string;
  isLastMessage: boolean;
  isTyping: boolean;
  onEdit: (newContent: string) => void;
  onRewind: () => void;
  messageIndex: number;
}

const FormattedContent = ({ content, isCharacter }: { content:string, isCharacter: boolean }) => {
  const regex = /(\*[^*]+\*)|("[^"]+")/g;
  const parts = content.split(regex).filter(Boolean);

  return (
    <p className="whitespace-pre-wrap break-words">
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
              &quot;<span className={cn(isCharacter && "text-accent")}>{part.slice(1, -1)}</span>&quot;
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </p>
  );
};


export default function ChatMessage({ message, characterPhoto, characterName, isLastMessage, isTyping, onEdit, onRewind, messageIndex }: ChatMessageProps) {
  const isCharacter = message.role === 'character';
  const isReceiving = isCharacter && isLastMessage && isTyping;

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const inputRef = useRef<HTMLInputElement>(null);

  const typedText = useTypewriter(message.content, 20);
  const content = isReceiving ? typedText : message.content;
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);
  
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
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className={cn("flex items-start gap-4 text-xl group", isCharacter ? 'justify-start' : 'justify-end')}>
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
      <div className="flex items-center gap-2 max-w-[75%]">
         <div className="flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isCharacter && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4" />
                </Button>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRewind}>
                <RotateCcw className="h-4 w-4" />
            </Button>
        </div>
        <div
          className={cn(
            "rounded-lg p-3",
            isCharacter
              ? "bg-secondary text-secondary-foreground"
              : "bg-primary text-primary-foreground"
          )}
        >
          {isEditing ? (
            <div className="flex gap-2 items-center">
              <Input
                ref={inputRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-lg bg-background/80"
              />
              <Button size="icon" onClick={handleSave} className="h-8 w-8"><Check className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={handleCancel} className="h-8 w-8"><X className="h-4 w-4" /></Button>
            </div>
          ) : (
             <FormattedContent content={content} isCharacter={isCharacter} />
          )}

          {isReceiving && content.length < message.content.length && (
              <span className="inline-block w-0.5 h-5 bg-foreground animate-[blink_1s_step-end_infinite] -mb-1 ml-1" />
          )}
        </div>
      </div>
    </div>
  );
}

