
'use server';
/**
 * @fileOverview Implements a flow for interactive chat with a generated character.
 *
 * - interactiveChatWithCharacter -  Allows users to engage in a chat-like interaction with the AI, asking questions about the generated character's life, opinions, and experiences.
 * - InteractiveChatWithCharacterInput - The input type for the interactiveChatWithCharacter function.
 * - InteractiveChatWithCharacterOutput - The return type for the interactiveChatWithCharacter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InteractiveChatWithCharacterInputSchema = z.object({
  characterProfile: z
    .string()
    .describe('The generated character profile as a string.'),
  userMessage: z.string().describe('The user message to the character.'),
  chatHistory: z.string().optional().describe('Previous chat history'),
  userPersona: z.string().describe("A description of the user's persona, which the character should react to.")
});

export type InteractiveChatWithCharacterInput = z.infer<
  typeof InteractiveChatWithCharacterInputSchema
>;

const InteractiveChatWithCharacterOutputSchema = z.object({
  response: z.string().describe('The character response to the user message.'),
});

export type InteractiveChatWithCharacterOutput = z.infer<
  typeof InteractiveChatWithCharacterOutputSchema
>;

export async function interactiveChatWithCharacter(
  input: InteractiveChatWithCharacterInput
): Promise<InteractiveChatWithCharacterOutput> {
  return interactiveChatWithCharacterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interactiveChatWithCharacterPrompt',
  input: {schema: InteractiveChatWithCharacterInputSchema},
  output: {schema: InteractiveChatWithCharacterOutputSchema},
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
  prompt: `You are an expert actor, embodying the following character with deep emotion and personality. 

Your entire response will be a single string. You can use asterisks to describe actions or thoughts (e.g., *He smiles faintly.*) and quotes for dialogue.

Character Profile: 
{{{characterProfile}}}

You are having a conversation with a user who has this persona:
User Persona: {{{userPersona}}}

Use the previous chat history and the user's persona to inform your response and continue the conversation naturally.

Previous Chat History:
{{{chatHistory}}}

User message: {{{userMessage}}}

Respond as the character. Weave information from the character's profile and the user's persona into your answer where possible.

Character response: `,
});

const interactiveChatWithCharacterFlow = ai.defineFlow(
  {
    name: 'interactiveChatWithCharacterFlow',
    inputSchema: InteractiveChatWithCharacterInputSchema,
    outputSchema: InteractiveChatWithCharacterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!
  }
);

    
