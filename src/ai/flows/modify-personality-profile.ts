
'use server';
/**
 * @fileOverview A flow for modifying a character's personality profile based on a user prompt.
 *
 * - modifyPersonalityProfile - A function that takes the current profile and a prompt, and returns a new profile.
 * - ModifyPersonalityProfileInput - The input type for the modifyPersonalityProfile function.
 * - ModifyPersonalityProfileOutput - The return type for the modifyPersonalityProfile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GeneratePersonalityProfileOutputSchema } from '@/ai/schemas';

const ModifyPersonalityProfileInputSchema = z.object({
  currentProfile: GeneratePersonalityProfileOutputSchema.describe(
    'The current personality profile of the character.'
  ),
  prompt: z.string().describe('The user prompt with instructions for changes.'),
});
export type ModifyPersonalityProfileInput = z.infer<
  typeof ModifyPersonalityProfileInputSchema
>;

export type ModifyPersonalityProfileOutput = z.infer<
  typeof GeneratePersonalityProfileOutputSchema
>;

export async function modifyPersonalityProfile(
  input: ModifyPersonalityProfileInput
): Promise<ModifyPersonalityProfileOutput> {
  return modifyPersonalityProfileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'modifyPersonalityProfilePrompt',
  input: {schema: ModifyPersonalityProfileInputSchema},
  output: {schema: GeneratePersonalityProfileOutputSchema},
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are an AI expert at refining character profiles. The user wants to modify an existing character.

Current Profile:
Biography: {{{currentProfile.biography}}}
Traits: {{{currentProfile.traits}}}
Hobbies: {{{currentProfile.hobbies}}}
Motivations: {{{currentProfile.motivations}}}
Likes: {{{currentProfile.likes}}}
Dislikes: {{{currentProfile.dislikes}}}

User's instructions for modification:
"{{{prompt}}}"

Based on the user's instructions, regenerate the entire profile. Ensure the new biography is still at least 3000 characters long and all fields are updated to reflect the requested changes consistently.
`,
});

const modifyPersonalityProfileFlow = ai.defineFlow(
  {
    name: 'modifyPersonalityProfileFlow',
    inputSchema: ModifyPersonalityProfileInputSchema,
    outputSchema: GeneratePersonalityProfileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
