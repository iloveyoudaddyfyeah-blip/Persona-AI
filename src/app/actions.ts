
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
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase/non-blocking-updates';
import { collection, doc, Firestore } from 'firebase/firestore';


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

// Note: Firestore instance is passed from the client
export async function createCharacterFromPhoto(
  firestore: Firestore,
  name: string,
  photoDataUri: string,
  tone: Tone,
  charLimit: number,
  userId: string,
): Promise<Character> {
  const profileData = await generatePersonalityProfile({ name, photoDataUri, tone, charLimit });
  const profile = formatProfile(name, profileData);
  const newCharacterId = doc(collection(firestore, 'users')).id; // Generate ID client-side
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

// Note: Firestore instance is passed from the client
export async function regenerateCharacterProfile(
  firestore: Firestore,
  character: Character,
  prompt: string,
  userId: string,
): Promise<Pick<Character, 'profile' | 'profileData'>> {
  const newProfileData = await modifyPersonalityProfile({
    currentProfile: character.profileData!,
    prompt,
  });
  const profile = formatProfile(character.name, newProfileData);
  
  const updatedCharacterData = { profile, profileData: newProfileData };

  const characterRef = doc(firestore, `users/${userId}/characters/${character.id}`);
  updateDocumentNonBlocking(characterRef, updatedCharacterData);

  return { profile, profileData: newProfileData };
}

// Note: Firestore instance is passed from the client
export async function getChatResponse(
  firestore: Firestore,
  character: Character,
  userMessage: string,
  userPersona: string,
  userId: string
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
  
  const newMessage = { role: 'user' as const, content: userMessage };
  const newResponse = { role: 'character' as const, content: response };
  
  const characterRef = doc(firestore, `users/${userId}/characters/${character.id}`);
    updateDocumentNonBlocking(characterRef, { 
      chatHistory: [...(character.chatHistory || []), newMessage, newResponse]
  });

  return response;
}

// Note: Firestore instance is passed from the client
export async function updateUserPersona(firestore: Firestore, userId: string, persona: string): Promise<void> {
    const userRef = doc(firestore, `users/${userId}`);
    setDocumentNonBlocking(userRef, { persona }, { merge: true });
}

// Note: Firestore instance is passed from the client
export async function saveCharacterChanges(firestore: Firestore, userId: string, character: Character): Promise<void> {
    const characterRef = doc(firestore, `users/${userId}/characters/${character.id}`);
    setDocumentNonBlocking(characterRef, character, { merge: true });
}

// Note: Firestore instance is passed from the client
export async function deleteCharacterFromDb(firestore: Firestore, userId: string, characterId: string): Promise<void> {
    const characterRef = doc(firestore, `users/${userId}/characters/${characterId}`);
    deleteDocumentNonBlocking(characterRef);
}
