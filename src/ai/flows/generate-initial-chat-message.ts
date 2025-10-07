
'use server';
/**
 * @fileOverview A flow for generating an initial chat message from a character.
 *
 * - generateInitialChatMessage - A function that takes a character profile and returns an initial message.
 * - GenerateInitialChatMessageInput - The input type for the function.
 * - GenerateInitialChatMessageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitialChatMessageInputSchema = z.object({
  characterName: z.string().describe("The character's name."),
  characterProfile: z
    .string()
    .describe('The full generated character profile as a string.'),
});
export type GenerateInitialChatMessageInput = z.infer<
  typeof GenerateInitialChatMessageInputSchema
>;

const GenerateInitialChatMessageOutputSchema = z.object({
  message: z.string().describe('The initial chat message from the character.'),
});
export type GenerateInitialChatMessageOutput = z.infer<
  typeof GenerateInitialChatMessageOutputSchema
>;

export async function generateInitialChatMessage(
  input: GenerateInitialChatMessageInput
): Promise<GenerateInitialChatMessageOutput> {
  return generateInitialChatMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInitialChatMessagePrompt',
  input: {schema: GenerateInitialChatMessageInputSchema},
  output: {schema: GenerateInitialChatMessageOutputSchema},
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are the character described below. Your name is {{{characterName}}}.

Character Profile:
{{{characterProfile}}}

Based on your personality, write a short, compelling introductory message. This is the very first thing a user will see from you. Make it engaging and in-character.

For example, you might say: *He glances up from his book, a faint smile playing on his lips.* "Can I help you with something?" or perhaps something more direct, depending on your personality.

Write your introductory message now:
`,
});

const generateInitialChatMessageFlow = ai.defineFlow(
  {
    name: 'generateInitialChatMessageFlow',
    inputSchema: GenerateInitialChatMessageInputSchema,
    outputSchema: GenerateInitialChatMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
