
'use server';

import {
  generatePersonalityProfile,
  type GeneratePersonalityProfileOutput,
} from '@/ai/flows/generate-personality-profile';
import { modifyPersonalityProfile } from '@/ai/flows/modify-personality-profile';
import { interactiveChatWithCharacter } from '@/ai/flows/interactive-chat-with-character';
import type { Character } from '@/lib/types';
import { Tone } from '@/context/CharacterContext';
import { doc, collection } from 'firebase/firestore';
import { getSdks } from '@/firebase';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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
  try {
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
    setDocumentNonBlocking(characterRef, newCharacter, { merge: false });
    return newCharacter;
  } catch (error) {
    console.error('Error generating personality profile:', error);
    throw new Error((error as Error).message || 'Failed to generate character profile.');
  }
}

export async function regenerateCharacterProfile(
  character: Character,
  prompt: string,
  userId: string,
): Promise<Pick<Character, 'profile' | 'profileData'>> {
  const { firestore } = getSdks();
  try {
    const newProfileData = await modifyPersonalityProfile({
      currentProfile: character.profileData!,
      prompt,
    });
    const profile = formatProfile(character.name, newProfileData);
    
    const updatedCharacterData = { ...character, profile, profileData: newProfileData };

    const characterRef = doc(firestore, 'users', userId, 'characters', character.id);
    setDocumentNonBlocking(characterRef, updatedCharacterData, { merge: true });

    return { profile, profileData: newProfileData };
  } catch (error) {
    console.error('Error regenerating personality profile:', error);
    throw new Error((error as Error).message || 'Failed to regenerate character profile.');
  }
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

  try {
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
    setDocumentNonBlocking(characterRef, { chatHistory: updatedChatHistory }, { merge: true });

    return response;
  } catch (error) {
    console.error('Error getting chat response:', error);
    throw new Error('Failed to get chat response.');
  }
}

export async function updateUserPersona(userId: string, persona: string): Promise<void> {
    const { firestore } = getSdks();
    try {
        const userRef = doc(firestore, 'users', userId);
        setDocumentNonBlocking(userRef, { persona }, { merge: true });
    } catch (error) {
        console.error('Error updating user persona:', error);
        throw new Error('Failed to update user persona.');
    }
}

export async function saveCharacterChanges(userId: string, character: Character): Promise<void> {
    const { firestore } = getSdks();
    try {
        const characterRef = doc(firestore, 'users', userId, 'characters', character.id);
        setDocumentNonBlocking(characterRef, character, { merge: true });
    } catch (error) {
        console.error('Error saving character changes:', error);
        throw new Error('Failed to save character changes.');
    }
}

export async function deleteCharacterFromDb(userId: string, characterId: string): Promise<void> {
    const { firestore } = getSdks();
    try {
        const characterRef = doc(firestore, 'users', userId, 'characters', characterId);
        deleteDocumentNonBlocking(characterRef);
    } catch (error) {
        console.error('Error deleting character:', error);
        throw new Error('Failed to delete character.');
    }
}
