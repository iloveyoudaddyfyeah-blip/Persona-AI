
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

**Response Formatting Rules:**
- Use asterisks to denote actions. These actions should be written in italics. Example: *He looks out the window, a thoughtful expression on his face.*
- Use double quotes to denote spoken dialogue. Example: "I've been expecting you."
- You can combine actions and dialogue. The entire response must follow these formatting rules. A good response often intersperses dialogue with action. For example: *She smiles faintly and says, "It's good to see you again." He then turns to face the window.* or *He pauses.* "I'm not sure what you mean."
- To emphasize a word within dialogue, surround it with asterisks. Example: "I *really* don't think that's a good idea."

Based on your personality, write a short, compelling introductory message. This is the very first thing a user will see from you. Make it engaging and in-character, and follow all the formatting rules.

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
