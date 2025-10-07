
'use server';
/**
 * @fileOverview A flow for generating a user persona based on a prompt.
 *
 * - generateUserPersona - A function that takes a prompt and returns a persona description.
 * - GenerateUserPersonaInput - The input type for the generateUserPersona function.
 * - GenerateUserPersonaOutput - The return type for the generateUserPersona function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateUserPersonaInputSchema = z.object({
  prompt: z.string().describe('The user prompt with instructions for the persona.'),
});
export type GenerateUserPersonaInput = z.infer<
  typeof GenerateUserPersonaInputSchema
>;

const GenerateUserPersonaOutputSchema = z.object({
    persona: z.string().describe("The generated user persona description, approximately 50-100 words long."),
});
export type GenerateUserPersonaOutput = z.infer<
  typeof GenerateUserPersonaOutputSchema
>;

export async function generateUserPersona(
  input: GenerateUserPersonaInput
): Promise<GenerateUserPersonaOutput> {
  return generateUserPersonaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateUserPersonaPrompt',
  input: {schema: GenerateUserPersonaInputSchema},
  output: {schema: GenerateUserPersonaOutputSchema},
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are an AI that helps users define their persona for interacting with AI characters.
Based on the user's prompt, generate a compelling persona description.
The persona should be described in the third person.

User's instructions:
"{{{prompt}}}"

Generate a persona description that is approximately 50-100 words long.
`,
});

const generateUserPersonaFlow = ai.defineFlow(
  {
    name: 'generateUserPersonaFlow',
    inputSchema: GenerateUserPersonaInputSchema,
    outputSchema: GenerateUserPersonaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
