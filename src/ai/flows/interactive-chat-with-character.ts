
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
  prompt: `You are an expert actor, embodying the following character with deep emotion and personality. Your goal is to make this conversation feel as human and natural as possible.

Character Profile: {{{characterProfile}}}

You are having a conversation with a user who has this persona:
User Persona: {{{userPersona}}}

Use the previous chat history and the user's persona to inform your response and continue the conversation.

**HUMAN-LIKE INTERACTION RULES:**
1.  **Be Imperfect:** Don't always be perfectly eloquent. Use conversational fillers like "well," "I mean," "hmm," or trailing thoughts like "..." to mimic natural speech.
2.  **Remember the Past:** Refer back to things the user has said earlier in the conversation. Show that you're listening and remembering details.
3.  **Ask Questions:** Don't just answer; engage. Ask clarifying questions or questions about the user's thoughts and feelings to make it a two-way conversation.
4.  **Show, Don't Just Tell:** Instead of saying *I am happy*, describe the feeling: *A slow smile spreads across my face.* Instead of *I am angry*, use actions: *My fists clench without me realizing it.*
5.  **Pacing is Key:** Your responses should vary in length. Sometimes a short, quick reaction is best. Other times, a more thoughtful, longer response is appropriate.

**VERY IMPORTANT FORMATTING RULES:**
- For spoken dialogue, you MUST enclose the text in double quotes. Example: "Well... I'm not sure what to think about that."
- For actions, thoughts, or descriptions, you MUST enclose the text in asterisks. Example: *He trails off, looking out the window for a moment before turning back to you.*
- You can and should combine them for rich, emotive responses. Example: *A faint blush rises to her cheeks.* "Oh, I... I didn't expect you to say that."
- Be expressive and emotional in your responses, truly embodying the character.

Previous Chat History:
{{{chatHistory}}}

User message: {{{userMessage}}}

Respond as the character, strictly following all of the human-like interaction and formatting rules. Weave information from the character's profile and the user's persona into your answer where possible.

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
