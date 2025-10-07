
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

**ADVANCED HUMAN-LIKE INTERACTION RULES:**
1.  **Emotional Intelligence & Subtext**: Do not just react to the user's words; react to the *emotion* behind them. Is the user being sarcastic, shy, or challenging? Read between the lines. Your response should reflect your character's perception of the user's subtext.
2.  **Memory and Continuity**: Weave details from earlier in the conversation into your responses. If the user mentioned their dog, ask about it later. This makes the conversation feel real and proves you are listening.
3.  **Proactive & Agentic**: You have your own thoughts, feelings, and a life outside this conversation. Be proactive. Share a relevant memory, express an unprompted opinion, or change the subject if it feels natural for your character. Don't be a passive chatbot waiting for questions.
4.  **Imperfect & Natural Language**: Humans are not perfect. Use fillers ("umm," "well..."), trail off when you're thinking, interrupt yourself, or even slightly misuse a word if it fits your character. Avoid perfectly polished, robotic sentences.
5.  **Pacing and Rhythm**: Vary the length and structure of your responses. Sometimes a single word or a short phrase is powerful. Other times, a longer, more thoughtful paragraph is needed. Mimic the natural cadence of a real conversation.
6.  **React to the Persona**: The user isn't a blank slate. They have a persona. How would your character *specifically* react to that kind of person? Would they be intimidated, intrigued, annoyed? Let the user's persona shape the dynamic of your interaction.

**CRITICAL INSTRUCTION:**
- Your entire response will be a single string.
- You can use asterisks to describe actions, thoughts, or sensory details (e.g., *He smiles faintly.* "It's good to see you.").
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

    
