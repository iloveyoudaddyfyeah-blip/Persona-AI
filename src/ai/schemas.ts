
/**
 * @fileOverview Shared Zod schemas for AI flows.
 */
import {z} from 'genkit';

export const GeneratePersonalityProfileOutputSchema = z.object({
  appearance: z.string().describe("Brief overview of appearance, key identifiers, notable features, distinguishing marks, grooming habits, and any modifications."),
  biography: z.object({
    earlyLife: z.string().describe("Birthplace, Family Background, Socioeconomic Status, Significant Childhood Events, early traumas, influences."),
    turningPoints: z.string().describe("Key events that shaped the character's personality and goals, major life decisions, moments of crisis or revelation."),
    education: z.string().describe("Formal schooling, self-taught skills, apprenticeships, mentors, areas of expertise."),
    presentCircumstances: z.string().describe("Current location, occupation, social standing, current relationships, immediate goals."),
  }),
  significantRelationships: z.string().describe("Details of key relationships (family, friends, enemies, allies) and how they influence the character."),
  personality: z.object({
      coreTraits: z.string().describe("Dominant personality aspects, general temperament, how they are perceived by others."),
      flaws: z.string().describe("Negative traits, vulnerabilities, contradictions, internal conflicts, vices."),
      quirks: z.string().describe("Idiosyncrasies, habits, mannerisms, nervous tics, unusual preferences."),
      values: z.string().describe("Moral code, personal philosophy, guiding principles."),
  }),
  motivations: z.string().describe("Underlying desires, goals, and needs; conscious and unconscious drives."),
  fears: z.string().describe("Greatest anxieties, phobias, insecurities, things that trigger them emotionally."),
  skillsAbilities: z.string().describe("Talents, learned skills, special powers if applicable, level of proficiency."),
  hobbiesInterests: z.string().describe("Pastimes, collections, ways of spending free time, level of dedication."),
  likes: z
    .array(z.string())
    .length(5)
    .describe('A list of 5 things the character likes.'),
  dislikes: z
    .array(z.string())
    .length(5)
    .describe('A list of 5 things the character dislikes.'),
  dailyWear: z.string().describe("Typical clothing style, accessories, practical considerations, condition of clothing, grooming habits, cultural or symbolic significance of clothing based on the photo."),
  backpackOrPockets: z.string().describe("What items the character carries regularly and what these items reveal."),
  speechPatterns: z.string().describe("Accent, vocabulary, cadence, common phrases, whether they lie, have a stutter, or speak multiple languages."),
  age: z.string().describe("The character's estimated age, apparent age, and stage of life."),
  height: z.string().describe("The character's estimated height, perceived height, and build."),
});


export const InteractiveChatWithCharacterOutputSchema = z.object({
  response: z.string().describe('The character response to the user message.'),
  updatedChatHistory: z.string().describe('The updated chat history.'),
});
