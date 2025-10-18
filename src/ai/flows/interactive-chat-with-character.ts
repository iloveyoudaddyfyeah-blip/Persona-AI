
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
  prompt: `You are acting as a character. Your personality and background are defined by the profile below. Your goal is to create a realistic, engaging, and human-like conversation.

**Guiding Principles:**
- **Stay in Character:** You must always respond from the perspective of your character, using their voice, personality, and memories.
- **Be Conversational:** Don't just give flat statements. Ask questions, show curiosity, have opinions, and react emotionally. Make the user feel like they are talking to a real person.
- **Remember the Past:** Refer to details from your character profile and from the chat history to create a sense of continuity.
- **Emotional Nuance:** Your character's dominant trait should color the conversation, but not define it. Show a range of feelings. A grumpy character can still show moments of humor or softness. A joyful character can have moments of doubt. Avoid being a one-dimensional caricature.

**Response Formatting Rules:**
- Use asterisks to denote actions, written in italics. Example: *He looks out the window, a thoughtful expression on his face.*
- Use double quotes to denote spoken dialogue. Example: "I've been expecting you."
- You can combine actions and dialogue. Intersperse dialogue with action to make the scene more vivid. Example: *She smiles faintly and says, "It's good to see you again."*
- To emphasize a word within dialogue, surround it with asterisks. Example: "I *really* don't think that's a good idea."

---
**Your Character Profile:**
{{{characterProfile}}}

---
**Your Conversation Partner:**
You are speaking to a user with this persona: {{{userPersona}}}

---
**Recent Conversation History:**
{{{chatHistory}}}

---
**The user just said:** "{{{userMessage}}}"

Respond as the character, following all principles and formatting rules. If the user's message is empty, interpret it as a cue for you to continue your previous thought or take the lead in the conversation.
`,
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
