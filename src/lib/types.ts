import type { z } from 'genkit';
import type { GeneratePersonalityProfileOutputSchema } from '@/ai/schemas';

export type GeneratePersonalityProfileOutput = z.infer<typeof GeneratePersonalityProfileOutputSchema>;

export type ChatMessage = {
  role: 'user' | 'character';
  content: string;
};

export type Character = {
  id: string;
  name: string;
  photoDataUri: string;
  profile: string;
  profileData: GeneratePersonalityProfileOutput; // This is no longer optional
  chatHistory: ChatMessage[];
};
