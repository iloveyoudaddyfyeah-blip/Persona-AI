'use server';

/**
 * @fileOverview This flow generates a detailed personality profile based on an uploaded photo.
 *
 * - generatePersonalityProfile - A function that generates the personality profile.
 * - GeneratePersonalityProfileInput - The input type for the generatePersonalityProfile function.
 * - GeneratePersonalityProfileOutput - The return type for the generatePersonalityProfile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalityProfileInputSchema = z.object({
  name: z.string().describe("The character's name."),
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GeneratePersonalityProfileInput = z.infer<
  typeof GeneratePersonalityProfileInputSchema
>;

const GeneratePersonalityProfileOutputSchema = z.object({
  biography: z
    .string()
    .describe('A detailed biography for the character.'),
  traits: z.string().describe('The key personality traits of the character.'),
  hobbies: z.string().describe('The hobbies and interests of the character.'),
  motivations: z
    .string()
    .describe('The primary motivations of the character.'),
  likes: z
    .array(z.string())
    .length(5)
    .describe('A list of 5 things the character likes.'),
  dislikes: z
    .array(z.string())
    .length(5)
    .describe('A list of 5 things the character dislikes.'),
});
export type GeneratePersonalityProfileOutput = z.infer<
  typeof GeneratePersonalityProfileOutputSchema
>;

export async function generatePersonalityProfile(
  input: GeneratePersonalityProfileInput
): Promise<GeneratePersonalityProfileOutput> {
  return generatePersonalityProfileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalityProfilePrompt',
  input: {schema: GeneratePersonalityProfileInputSchema},
  output: {schema: GeneratePersonalityProfileOutputSchema},
  prompt: `You are an AI that crafts detailed personality profiles based on uploaded photos. The character's name is {{{name}}}. Analyze the photo and create a profile including a biography, traits, hobbies, motivations, and a list of 5 likes and 5 dislikes.

Photo: {{media url=photoDataUri}}`,
});

const generatePersonalityProfileFlow = ai.defineFlow(
  {
    name: 'generatePersonalityProfileFlow',
    inputSchema: GeneratePersonalityProfileInputSchema,
    outputSchema: GeneratePersonalityProfileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
