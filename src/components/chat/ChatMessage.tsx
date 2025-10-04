
"use client";

import { useTypewriter } from '@/hooks/use-typewriter';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ChatMessageProps {
  message: ChatMessageType;
  characterPhoto: string;
  characterName: string;
  isLastMessage: boolean;
  isTyping: boolean;
}

const FormattedContent = ({ content, role }: { content: string; role: ChatMessageType['role'] }) => {
  const regex = /(\*[^*]+\*)|("[^"]+")/g;
  const parts = content.split(regex).filter(Boolean);

  return (
    <p className="whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <em key={index} className="text-muted-foreground not-italic">
              {part}
            </em>
          );
        }
        if (part.startsWith('"') && part.endsWith('"')) {
           return (
            <span key={index} className="text-primary-foreground">
              {part}
            </span>
          );
        }
        // For character responses, non-dialogue/action parts can have a different color if desired
        if (role === 'character') {
             return <span key={index}>{part}</span>;
        }
        return <span key={index}>{part}</span>;
      })}
    </p>
  );
};


export default function ChatMessage({ message, characterPhoto, characterName, isLastMessage, isTyping }: ChatMessageProps) {
  const isCharacter = message.role === 'character';
  
  // A new message is being typed if it's the last message, from the character, AND the interface is "typing".
  const isReceiving = isCharacter && isLastMessage && isTyping;

  // Use the typewriter effect only for the message that is actively being received.
  const displayedText = useTypewriter(isReceiving ? message.content : '');

  // If the message is not being received, show its full content instantly.
  const content = isReceiving ? displayedText : message.content;


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
        <FormattedContent content={content} role={message.role} />
        {/* Only show the blinking caret if the text is actively being typed out */}
        {isReceiving && content.length < message.content.length && (
            <span className="inline-block w-0.5 h-5 bg-foreground animate-[blink_1s_step-end_infinite] -mb-1 ml-1" />
        )}
      </div>
    </div>
  );
}
