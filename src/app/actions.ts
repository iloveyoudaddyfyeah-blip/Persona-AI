
'use server';

import {
  generatePersonalityProfile,
  type GeneratePersonalityProfileOutput,
} from '@/ai/flows/generate-personality-profile';
import { modifyPersonalityProfile } from '@/ai/flows/modify-personality-profile';
import { interactiveChatWithCharacter } from '@/ai/flows/interactive-chat-with-character';
import { generateUserPersona } from '@/ai/flows/generate-user-persona';
import type { Character, ChatMessage, UserPersona } from '@/lib/types';
import { Tone } from '@/context/CharacterContext';
import {
  setDoc
} from 'firebase/firestore';
import { collection, doc, type Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


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
  userPersona: UserPersona | null
): Promise<ChatMessage> {
  const personaDescription = userPersona?.description || 'A curious individual trying to get to know the characters.';
  
  let history = character.chatHistory || [];

  const historyString = history
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
    userPersona: personaDescription,
  });
  
  return { role: 'character', content: response };
}


export async function generatePersonaFromPrompt(prompt: string): Promise<string> {
  const { persona } = await generateUserPersona({ prompt });
  return persona;
}

export async function saveUserPersona(db: Firestore, userId: string, persona: UserPersona): Promise<void> {
  const personaRef = doc(db, 'users', userId, 'personas', persona.id);
  setDoc(personaRef, persona)
    .catch((error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: personaRef.path,
        operation: 'create',
        requestResourceData: persona,
      }));
    });
}
