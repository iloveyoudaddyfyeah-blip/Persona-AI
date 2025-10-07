

import type { z } from 'genkit';
import type { GeneratePersonalityProfileOutputSchema } from '@/ai/schemas';
import type { Settings } from '@/context/CharacterContext';

export type GeneratePersonalityProfileOutput = z.infer<typeof GeneratePersonalityProfileOutputSchema>;

export type ChatMessage = {
  role: 'user' | 'character';
  content: string;
};

export type ChatSession = {
  id: string;
  name: string;
  createdAt: number; // unix timestamp
  messages: ChatMessage[];
};

export type Character = {
  id: string;
  name: string;
  photoDataUri: string;
  profile: string;
  profileData?: GeneratePersonalityProfileOutput;
  chatSessions: ChatSession[];
  activeChatId: string | null;
};

export type UserPersona = {
    id: string;
    name: string;
    description: string;
    photoDataUri: string;
    isActive: boolean;
}

export type UserData = {
    settings?: Partial<Settings>;
    subscriptionStatus?: 'free' | 'premium';
    activePersonaId?: string;
}

export type GenerateCharacterFromFormInput = {
    name: string;
    intro: string;
    personality: string;
    welcomeMessage: string;
}
