
'use server';

import {
  generatePersonalityProfile,
  type GeneratePersonalityProfileOutput,
} from '@/ai/flows/generate-personality-profile';
import { modifyPersonalityProfile } from '@/ai/flows/modify-personality-profile';
import { interactiveChatWithCharacter } from '@/ai/flows/interactive-chat-with-character';
import { generateUserPersona } from '@/ai/flows/generate-user-persona';
import type { Character } from '@/lib/types';
import { Tone } from '@/context/CharacterContext';
import {
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase/non-blocking-updates';
import { collection, doc, type Firestore } from 'firebase/firestore';


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
  photoDataUri: string,
  tone: Tone,
  charLimit: number,
  userId: string,
): Promise<GeneratePersonalityProfileOutput & { profile: string }> {
  const profileData = await generatePersonalityProfile({ name, photoDataUri, tone, charLimit });
  const profile = formatProfile(name, profileData);
  return { ...profileData, profile };
}

export async function regenerateCharacterProfile(
  character: Character,
  prompt: string,
): Promise<Pick<Character, 'profile' | 'profileData'>> {
  if (!character.profileData) {
    throw new Error("Cannot regenerate a profile that doesn't have profileData.");
  }
  const newProfileData = await modifyPersonalityProfile({
    currentProfile: character.profileData,
    prompt,
  });
  const profile = formatProfile(character.name, newProfileData);
  
  return { profile, profileData: newProfileData };
}

export async function getChatResponse(
  character: Character,
  userMessage: string,
  userPersona: string
): Promise<string> {
  const historyString = (character.chatHistory || [])
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Character'}: ${msg.content}`)
    .join('\n');
  
  const maxHistoryLength = 10000;
  const truncatedHistory = historyString.length > maxHistoryLength 
    ? historyString.slice(-maxHistoryLength) 
    : historyString;

  const { response } = await interactiveChatWithCharacter({
    characterProfile: character.profile,
    userMessage,
    chatHistory: truncatedHistory,
    userPersona,
  });
  
  return response;
}


export async function generatePersonaFromPrompt(prompt: string): Promise<string> {
  const { persona } = await generateUserPersona({ prompt });
  return persona;
}
