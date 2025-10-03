
'use server';

import {
  generatePersonalityProfile,
  type GeneratePersonalityProfileOutput,
} from '@/ai/flows/generate-personality-profile';
import { modifyPersonalityProfile } from '@/ai/flows/modify-personality-profile';
import { interactiveChatWithCharacter } from '@/ai/flows/interactive-chat-with-character';
import type { Character, ChatMessage } from '@/lib/types';

function formatProfile(
  name: string,
  profileData: GeneratePersonalityProfileOutput
): string {
  const { biography, traits, hobbies, motivations, likes, dislikes } =
    profileData;
  return `**Name:** ${name}

**Biography:**
${biography}

**Personality Traits:**
${traits}

**Hobbies:**
${hobbies}

**Motivations:**
${motivations}

**Likes:**
- ${likes.join('\n- ')}

**Dislikes:**
- ${dislikes.join('\n- ')}
`;
}

export async function createCharacterFromPhoto(
  name: string,
  photoDataUri: string
): Promise<Pick<Character, 'profile' | 'profileData'>> {
  try {
    const profileData = await generatePersonalityProfile({ name, photoDataUri });
    const profile = formatProfile(name, profileData);
    return { profile, profileData };
  } catch (error) {
    console.error('Error generating personality profile:', error);
    throw new Error('Failed to generate character profile.');
  }
}

export async function regenerateCharacterProfile(
  name: string,
  currentProfileData: GeneratePersonalityProfileOutput,
  prompt: string
): Promise<Pick<Character, 'profile' | 'profileData'>> {
  try {
    const newProfileData = await modifyPersonalityProfile({
      currentProfile: currentProfileData,
      prompt,
    });
    const profile = formatProfile(name, newProfileData);
    return { profile, profileData: newProfileData };
  } catch (error) {
    console.error('Error regenerating personality profile:', error);
    throw new Error('Failed to regenerate character profile.');
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
