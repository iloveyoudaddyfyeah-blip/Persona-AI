
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
import { GeneratePersonalityProfileOutputSchema } from '@/ai/schemas';

const GeneratePersonalityProfileInputSchema = z.object({
  name: z.string().describe("The character's name."),
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  tone: z.string().optional().default('default').describe("The tone of voice for the generation. Can be 'witty', 'serious', 'whimsical', 'poetic' or 'default'"),
  charLimit: z.number().optional().default(3000).describe("The minimum character length for the biography.")
});
export type GeneratePersonalityProfileInput = z.infer<
  typeof GeneratePersonalityProfileInputSchema
>;

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
  prompt: `You are an AI that crafts highly detailed and rich personality profiles based on uploaded photos. The character's name is {{{name}}}. 

Your response should be in a {{{tone}}} tone.

Analyze the photo and create an exceptionally detailed profile. The biography must be at least {{{charLimit}}} characters long, weaving a complex and compelling narrative. Also include traits, hobbies, motivations, and a list of 5 likes and 5 dislikes.

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
