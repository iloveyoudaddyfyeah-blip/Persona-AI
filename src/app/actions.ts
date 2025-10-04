
'use server';

import {
  generatePersonalityProfile,
  type GeneratePersonalityProfileOutput,
} from '@/ai/flows/generate-personality-profile';
import { modifyPersonalityProfile } from '@/ai/flows/modify-personality-profile';
import { interactiveChatWithCharacter } from '@/ai/flows/interactive-chat-with-character';
import type { Character } from '@/lib/types';
import { Tone } from '@/context/CharacterContext';
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase/non-blocking-updates';
import { collection, doc, firestore } from 'firebase/firestore';
import { getClientSdks } from '@/firebase/client';
import { initializeFirebaseOnClient } from '@/firebase/client';
import { getFirebaseAdmin } from '@/firebase/server';


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
  const { firestore } = initializeFirebaseOnClient();
  const profileData = await generatePersonalityProfile({ name, photoDataUri, tone, charLimit });
  const profile = formatProfile(name, profileData);
  const newCharacterId = crypto.randomUUID();
  const newCharacter: Character = {
      id: newCharacterId,
      name,
      photoDataUri,
      profile,
      profileData,
      chatHistory: [],
  };
  const characterRef = doc(firestore, `users/${userId}/characters/${newCharacterId}`);
  setDocumentNonBlocking(characterRef, newCharacter, { merge: false });
  return newCharacter;
}

export async function regenerateCharacterProfile(
  character: Character,
  prompt: string,
  userId: string,
): Promise<Pick<Character, 'profile' | 'profileData'>> {
    const { firestore } = initializeFirebaseOnClient();
  const newProfileData = await modifyPersonalityProfile({
    currentProfile: character.profileData!,
    prompt,
  });
  const profile = formatProfile(character.name, newProfileData);
  
  const updatedCharacterData = { ...character, profile, profileData: newProfileData };

  const characterRef = doc(firestore, `users/${userId}/characters/${character.id}`);
  setDocumentNonBlocking(characterRef, updatedCharacterData, { merge: true });

  return { profile, profileData: newProfileData };
}

export async function getChatResponse(
  character: Character,
  userMessage: string,
  userPersona: string,
  userId: string
): Promise<string> {
    const { firestore } = initializeFirebaseOnClient();
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
  
  const characterRef = doc(firestore, `users/${userId}/characters/${character.id}`);
    updateDocumentNonBlocking(characterRef, { 
      chatHistory: [...(character.chatHistory || []), newMessage, newResponse]
  });

  return response;
}

export async function updateUserPersona(userId: string, persona: string): Promise<void> {
    const { firestore } = initializeFirebaseOnClient();
    const userRef = doc(firestore, `users/${userId}`);
    setDocumentNonBlocking(userRef, { persona }, { merge: true });
}

export async function saveCharacterChanges(userId: string, character: Character): Promise<void> {
    const { firestore } = initializeFirebaseOnClient();
    const characterRef = doc(firestore, `users/${userId}/characters/${character.id}`);
    setDocumentNonBlocking(characterRef, character, { merge: true });
}

export async function deleteCharacterFromDb(userId: string, characterId: string): Promise<void> {
    const { firestore } = initializeFirebaseOnClient();
    const characterRef = doc(firestore, `users/${userId}/characters/${characterId}`);
    deleteDocumentNonBlocking(characterRef);
}
