
import type { z } from 'genkit';
import type { GeneratePersonalityProfileOutputSchema, InteractiveChatWithCharacterOutputSchema } from '@/ai/schemas';
import type { Settings } from '@/context/CharacterContext';

export type GeneratePersonalityProfileOutput = z.infer<typeof GeneratePersonalityProfileOutputSchema>;
export type InteractiveChatWithCharacterOutput = z.infer<typeof InteractiveChatWithCharacterOutputSchema>;

export type ChatMessage = {
  role: 'user' | 'character';
  content: string;
};

export type Character = {
  id: string;
  name: string;
  photoDataUri: string;
  profile: string;
  profileData?: GeneratePersonalityProfileOutput;
  chatHistory: ChatMessage[];
};

export type UserData = {
    persona?: string;
    settings?: Partial<Settings>;
    subscriptionStatus?: 'free' | 'premium';
}
