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
});

export type InteractiveChatWithCharacterInput = z.infer<
  typeof InteractiveChatWithCharacterInputSchema
>;

const InteractiveChatWithCharacterOutputSchema = z.object({
  response: z.string().describe('The character response to the user message.'),
  updatedChatHistory: z.string().describe('The updated chat history.'),
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
  prompt: `You are embodying the following character:

Character Profile: {{{characterProfile}}}

You are having a conversation with a user. Use the previous chat history to continue the conversation.

**IMPORTANT FORMATTING RULES:**
- For spoken dialogue, enclose the text in double quotes. Example: "Hello, how are you?"
- For actions or descriptions, enclose the text in asterisks. Example: *He smiles and waves.*
- You can combine them. Example: *She looks up from her book.* "Did you need something?"

Previous Chat History:
{{{chatHistory}}}

User message: {{{userMessage}}}

Respond as the character, following the formatting rules. Weave information from the character's profile into the AI generated answer where possible. The AI tool will make choices to either weave some information into the AI generated answer. The AI has a memory store.

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
    return {
      response: output!.response,
      updatedChatHistory: input.chatHistory
        ? input.chatHistory + '\nUser: ' + input.userMessage + '\nCharacter: ' + output!.response
        : 'User: ' + input.userMessage + '\nCharacter: ' + output!.response,
    };
  }
);
