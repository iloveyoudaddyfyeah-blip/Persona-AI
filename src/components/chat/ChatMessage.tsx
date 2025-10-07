
"use client";

import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Pencil, Check, X, RotateCcw, ChevronRight, RotateCw } from 'lucide-react';
import { Textarea } from '../ui/textarea';

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


export default function ChatMessage({ message, characterPhoto, characterName, isLastMessage, isTyping, onEdit, onRewind, onContinue, onRegenerate }: ChatMessageProps) {
  const isCharacter = message.role === 'character';

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const content = message.content;
  
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);
  
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

  const showContinueButton = isCharacter && isLastMessage && !isTyping;
  const showRegenerateButton = isCharacter && isLastMessage && !isTyping;


  return (
    <div className={cn("flex flex-col gap-1 group", isCharacter ? 'items-start' : 'items-end')}>
      <div className={cn("flex items-start gap-4 text-xl w-full", isCharacter ? 'justify-start' : 'justify-end')}>
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
        <div
          className={cn(
            "rounded-lg p-3 w-full max-w-[75%]",
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
                className="text-lg bg-background/80 resize-none overflow-hidden w-full"
                rows={1}
            />
          ) : (
             <FormattedContent content={content} isCharacter={isCharacter} />
          )}
        </div>
      </div>
      <div className={cn("flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity", 
        isCharacter ? 'pl-16' : 'pr-0'
      )}>
        {isEditing ? (
            <>
                <Button size="sm" onClick={handleSave} className="h-7 text-xs">
                    <Check className="h-3 w-3 mr-1" /> Save
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 text-xs">
                    <X className="h-3 w-3 mr-1" /> Cancel
                </Button>
            </>
        ) : (
            <>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditing(true)} title="Edit">
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRewind} title="Rewind to here">
                    <RotateCcw className="h-4 w-4" />
                </Button>
                {showContinueButton && (
                   <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onContinue} title="Continue">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                )}
                 {showRegenerateButton && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRegenerate} title="Regenerate">
                        <RotateCw className="h-4 w-4" />
                    </Button>
                )}
            </>
        )}
        </div>
    </div>
  );
}

    