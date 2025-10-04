
'use server';

import {
  generatePersonalityProfile,
  type GeneratePersonalityProfileOutput,
} from '@/ai/flows/generate-personality-profile';
import { modifyPersonalityProfile } from '@/ai/flows/modify-personality-profile';
import { interactiveChatWithCharacter } from '@/ai/flows/interactive-chat-with-character';
import type { Character } from '@/lib/types';
import { Tone } from '@/context/CharacterContext';
import { doc } from 'firebase/firestore';
import { getSdks } from '@/firebase';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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
): Promise<Character> {
  const { firestore } = getSdks();
  const profileData = await generatePersonalityProfile({ name, photoDataUri, tone, charLimit });
  const profile = formatProfile(name, profileData);
  const newCharacter: Character = {
      id: crypto.randomUUID(),
      name,
      photoDataUri,
      profile,
      profileData,
      chatHistory: [],
  };
  const characterRef = doc(firestore, 'users', userId, 'characters', newCharacter.id);
  // Non-blocking write, will emit contextual error on failure
  setDocumentNonBlocking(characterRef, newCharacter, { merge: false });
  return newCharacter;
}

export async function regenerateCharacterProfile(
  character: Character,
  prompt: string,
  userId: string,
): Promise<Pick<Character, 'profile' | 'profileData'>> {
  const { firestore } = getSdks();
  const newProfileData = await modifyPersonalityProfile({
    currentProfile: character.profileData!,
    prompt,
  });
  const profile = formatProfile(character.name, newProfileData);
  
  const updatedCharacterData = { ...character, profile, profileData: newProfileData };

  const characterRef = doc(firestore, 'users', userId, 'characters', character.id);
  // Non-blocking write, will emit contextual error on failure
  setDocumentNonBlocking(characterRef, updatedCharacterData, { merge: true });

  return { profile, profileData: newProfileData };
}

export async function getChatResponse(
  character: Character,
  userMessage: string,
  userPersona: string,
  userId: string
): Promise<string> {
  const { firestore } = getSdks();
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
  
  const newMessage = { role: 'user' as const, content: userMessage };
  const newResponse = { role: 'character' as const, content: response };
  const updatedChatHistory = [...(character.chatHistory || []), newMessage, newResponse];
  
  const characterRef = doc(firestore, 'users', userId, 'characters', character.id);
  // Non-blocking write, will emit contextual error on failure
  updateDocumentNonBlocking(characterRef, { chatHistory: updatedChatHistory });

  return response;
}

export async function updateUserPersona(userId: string, persona: string): Promise<void> {
    const { firestore } = getSdks();
    const userRef = doc(firestore, 'users', userId);
    // Non-blocking write, will emit contextual error on failure
    setDocumentNonBlocking(userRef, { persona }, { merge: true });
}

export async function saveCharacterChanges(userId: string, character: Character): Promise<void> {
    const { firestore } = getSdks();
    const characterRef = doc(firestore, 'users', userId, 'characters', character.id);
    // Non-blocking write, will emit contextual error on failure
    setDocumentNonBlocking(characterRef, character, { merge: true });
}

export async function deleteCharacterFromDb(userId: string, characterId: string): Promise<void> {
    const { firestore } = getSdks();
    const characterRef = doc(firestore, 'users', userId, 'characters', characterId);
    // Non-blocking delete, will emit contextual error on failure
    deleteDocumentNonBlocking(characterRef);
}
