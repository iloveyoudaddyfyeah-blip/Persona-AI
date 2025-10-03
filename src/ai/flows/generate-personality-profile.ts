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
  profile: z
    .string()
    .max(10000)
    .describe(
      'A detailed personality profile including biography, traits, hobbies, and motivations. Limited to 10,000 characters.'
    ),
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
  prompt: `You are an AI that crafts detailed personality profiles based on uploaded photos. Analyze the photo and create a profile including a biography, traits, hobbies, and motivations, limited to 10,000 characters.\n\nPhoto: {{media url=photoDataUri}}`,
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
