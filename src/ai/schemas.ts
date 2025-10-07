
/**
 * @fileOverview Shared Zod schemas for AI flows.
 */
import {z} from 'genkit';

export const GeneratePersonalityProfileOutputSchema = z.object({
  biography: z
    .string()
    .describe('A detailed biography for the character, at least 3000 characters long.'),
  dailyWear: z.string().describe("A description of the character's typical daily clothing style."),
  age: z.string().describe("The character's estimated age."),
  height: z.string().describe("The character's estimated height."),
  fears: z.string().describe("A description of the character's primary fears."),
  traits: z.string().describe('The key personality traits of the character.'),
  hobbies: z.string().describe('The hobbies and interests of the character.'),
  motivations: z
    .string()
    .describe('The primary motivations of the character.'),
  likes: z
    .array(z.string())
    .length(5)
    .describe('A list of 5 things the character likes.'),
  dislikes: z
    .array(z.string())
    .length(5)
    .describe('A list of 5 things the character dislikes.'),
});

export const InteractiveChatWithCharacterOutputSchema = z.object({
  response: z.string().describe('The character response to the user message.'),
  updatedChatHistory: z.string().describe('The updated chat history.'),
});
