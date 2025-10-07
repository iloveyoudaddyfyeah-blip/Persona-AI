
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
  tone: z.string().optional().default('default').describe("The tone of voice for the generation. Can be one of: 'default', 'joyful', 'anxious', 'angry', 'serene', 'passionate', 'apathetic', 'fearful', 'hopeful', 'jaded', 'enthusiastic', 'grumpy', 'curious', 'confident', 'shy', 'ambitious', 'content', 'bitter', 'loving', 'resentful', 'brave', 'timid', 'arrogant', 'humble', 'playful', 'reserved'"),
  charLimit: z.number().optional().default(1000).describe("The minimum character length for the entire generated profile.")
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
  system: `You are an AI that crafts highly detailed, emotionally resonant, and rich personality profiles based on uploaded photos. You are a master storyteller and character creator.`,
  prompt: `The character's name is {{{name}}}. 

Your response MUST be in a {{{tone}}} tone. This should heavily influence your word choice, sentence structure, and overall style. For example, 'noir' should be gritty and shadow-filled, while 'whimsical' should be light and fanciful. 'Lovecraftian' should be filled with cosmic dread, and 'Cyberpunk' should be cynical and high-tech.

Analyze the photo and create an exceptionally detailed and compelling profile for the character named {{{name}}}. 

The total length of your entire response (biography, traits, hobbies, etc. combined) must be at least {{{charLimit}}} characters.

- **Biography**: Weave a complex and compelling narrative about {{{name}}}.
- **Traits**: Describe their key personality traits with nuance and depth. Avoid one-word answers.
- **Hobbies**: List hobbies that feel specific and revealing about the character. These should be more than simple activities; they should tell a story.
- **Motivations**: What are their deepest drivers, fears, and secret desires? What do they truly want?
- **Likes & Dislikes**: Provide a list of 5 specific and interesting likes and 5 dislikes. Avoid generic answers. Instead of "food", try "the taste of ozone after a thunderstorm" or "the specific silence of a library just before closing". These should be deeply personal to the character.

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
