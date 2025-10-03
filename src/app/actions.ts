
'use server';

import { generatePersonalityProfile } from '@/ai/flows/generate-personality-profile';
import { interactiveChatWithCharacter } from '@/ai/flows/interactive-chat-with-character';
import type { Character, ChatMessage } from '@/lib/types';

export async function createCharacterFromPhoto(
  photoDataUri: string
): Promise<Pick<Character, 'profile'>> {
  try {
    const { profile } = await generatePersonalityProfile({ photoDataUri });
    return { profile };
  } catch (error) {
    console.error('Error generating personality profile:', error);
    throw new Error('Failed to generate character profile.');
  }
}

export async function getChatResponse(
  characterProfile: string,
  userMessage: string,
  chatHistory: ChatMessage[]
): Promise<string> {
  const historyString = chatHistory
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Character'}: ${msg.content}`)
    .join('\n');
  
  // Truncate history if it exceeds 10,000 characters
  const maxHistoryLength = 10000;
  const truncatedHistory = historyString.length > maxHistoryLength 
    ? historyString.slice(-maxHistoryLength) 
    : historyString;

  try {
    const { response } = await interactiveChatWithCharacter({
      characterProfile,
      userMessage,
      chatHistory: truncatedHistory,
    });
    return response;
  } catch (error) {
    console.error('Error getting chat response:', error);
    throw new Error('Failed to get chat response.');
  }
}
