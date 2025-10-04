
'use server';

import {
  generatePersonalityProfile,
  type GeneratePersonalityProfileOutput,
} from '@/ai/flows/generate-personality-profile';
import { modifyPersonalityProfile } from '@/ai/flows/modify-personality-profile';
import { interactiveChatWithCharacter } from '@/ai/flows/interactive-chat-with-character';
import type { Character } from '@/lib/types';
import { Tone } from '@/context/CharacterContext';
import { getFirebaseAdmin } from '@/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

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
  const { firestore } = await getFirebaseAdmin();
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
  const characterRef = firestore.doc(`users/${userId}/characters/${newCharacterId}`);
  await characterRef.set(newCharacter, { merge: false });
  return newCharacter;
}

export async function regenerateCharacterProfile(
  character: Character,
  prompt: string,
  userId: string,
): Promise<Pick<Character, 'profile' | 'profileData'>> {
  const { firestore } = await getFirebaseAdmin();
  const newProfileData = await modifyPersonalityProfile({
    currentProfile: character.profileData!,
    prompt,
  });
  const profile = formatProfile(character.name, newProfileData);
  
  const updatedCharacterData = { ...character, profile, profileData: newProfileData };

  const characterRef = firestore.doc(`users/${userId}/characters/${character.id}`);
  await characterRef.set(updatedCharacterData, { merge: true });

  return { profile, profileData: newProfileData };
}

export async function getChatResponse(
  character: Character,
  userMessage: string,
  userPersona: string,
  userId: string
): Promise<string> {
  const { firestore } = await getFirebaseAdmin();
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
  
  const characterRef = firestore.doc(`users/${userId}/characters/${character.id}`);
  await characterRef.update({ 
      chatHistory: FieldValue.arrayUnion(newMessage, newResponse) 
  });

  return response;
}

export async function updateUserPersona(userId: string, persona: string): Promise<void> {
    const { firestore } = await getFirebaseAdmin();
    const userRef = firestore.doc(`users/${userId}`);
    await userRef.set({ persona }, { merge: true });
}

export async function saveCharacterChanges(userId: string, character: Character): Promise<void> {
    const { firestore } = await getFirebaseAdmin();
    const characterRef = firestore.doc(`users/${userId}/characters/${character.id}`);
    await characterRef.set(character, { merge: true });
}

export async function deleteCharacterFromDb(userId: string, characterId: string): Promise<void> {
    const { firestore } = await getFirebaseAdmin();
    const characterRef = firestore.doc(`users/${userId}/characters/${characterId}`);
    await characterRef.delete();
}
