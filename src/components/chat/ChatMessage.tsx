
"use client";

import { useTypewriter } from '@/hooks/use-typewriter';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ChatMessageProps {
  message: ChatMessageType;
  characterPhoto: string;
  characterName: string;
}

export default function ChatMessage({ message, characterPhoto, characterName }: ChatMessageProps) {
  const isCharacter = message.role === 'character';
  const displayedText = isCharacter ? useTypewriter(message.content) : message.content;

  return (
    <div className={cn("flex items-start gap-4 text-xl", isCharacter ? 'justify-start' : 'justify-end')}>
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
          "max-w-[75%] rounded-lg p-3",
          isCharacter
            ? "bg-secondary text-secondary-foreground"
            : "bg-primary text-primary-foreground"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{displayedText}{isCharacter && <span className="inline-block w-0.5 h-4 bg-foreground animate-[blink-caret_1s_step-end_infinite] ml-1" />}</p>
      </div>
    </div>
  );
}
