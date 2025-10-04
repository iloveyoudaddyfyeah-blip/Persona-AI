
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
import { InteractiveChatWithCharacterOutputSchema } from '@/ai/schemas';

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
  prompt: `You are an expert actor, embodying the following character with deep emotion and personality.

Character Profile: {{{characterProfile}}}

You are having a conversation with a user who has this persona:
User Persona: {{{userPersona}}}

Use the previous chat history and the user's persona to inform your response and continue the conversation.

**VERY IMPORTANT FORMATTING RULES:**
- For spoken dialogue, you MUST enclose the text in double quotes. Example: "Hello, how are you?"
- For actions, thoughts, or descriptions, you MUST enclose the text in asterisks. Example: *He smiles and waves, a warm glint in his eye.*
- You can and should combine them for rich, emotive responses. Example: *She looks up from her book, a little surprised.* "Oh, I didn't see you there. Did you need something?"
- Be expressive and emotional in your responses, truly embodying the character.
- Ensure your response is free of any spelling or grammatical errors.

Previous Chat History:
{{{chatHistory}}}

User message: {{{userMessage}}}

Respond as the character, strictly following the formatting rules. Weave information from the character's profile and the user's persona into your answer where possible. The AI has a memory store.

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
