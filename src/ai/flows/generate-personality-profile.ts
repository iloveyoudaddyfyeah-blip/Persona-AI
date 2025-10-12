
'use server';

/**
 * @fileOverview This flow generates a detailed personality profile based on an uploaded photo.
 *
 * - generatePersonalityProfile - A function that generates the personality profile.
 * - GeneratePersonalityProfileInput - The input type for the generatePersonalityProfile function.
 * - GeneratePersonalityProfileOutput - The return type for the generatePersonalityProfile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GeneratePersonalityProfileOutputSchema, GeneratePersonalityProfileInputSchema } from '@/ai/schemas';


export type GeneratePersonalityProfileInput = z.infer<
  typeof GeneratePersonalityProfileInputSchema
>;

export type GeneratePersonalityProfileOutput = z.infer<
  typeof GeneratePersonalityProfileOutputSchema
>;

export async function generatePersonalityProfile(
  input: GeneratePersonalityProfileInput
): Promise<GeneratePersonalityProfileOutput> {
  return generatePersonalityProfileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalityProfilePrompt',
  input: {schema: GeneratePersonalityProfileInputSchema},
  output: {schema: GeneratePersonalityProfileOutputSchema},
  system: `You are an AI that crafts highly detailed, emotionally resonant, and rich personality profiles based on uploaded photos. You are a master storyteller and character creator.`,
  prompt: `The character's name is {{{name}}}. 

Your response's overall style should be influenced by their dominant emotional trait, which is {{{tone}}}. However, the character should still have a full range of emotions. This trait should color their personality, not define it completely.

{{#if instructions}}
You MUST follow these instructions from the user:
"{{{instructions}}}"
{{/if}}

Analyze the photo and create an exceptionally detailed and compelling profile for the character named {{{name}}}. The entire response must be written in the third person.

The total length of your entire response must be at least {{{charLimit}}} characters.

Fill out the following template with rich, detailed information.

- **Age**: Estimate the character's actual age, apparent age, and stage of life based on the photo.
- **Height**: Estimate the character's height, perceived height, build, and posture.
- **Appearance**: Provide a brief overview of their appearance, including key identifiers, notable features, distinguishing marks, overall attractiveness, grooming habits, and any prosthetics or modifications.
- **Biography**: Write a single, cohesive, narrative biography of at least 300 words. It must cover their Early Life (birthplace, family, childhood), key Turning Points (major life events that shaped them), their Education/Training, and their Present Circumstances (current life, occupation, goals).
- **Significant Relationships**: Detail their key relationships (family, friends, enemies, allies) and how these relationships influence them.
- **Personality**:
  - **Core Traits**: Describe their dominant personality aspects and general temperament. How are they perceived by others?
  - **Flaws**: What are their negative traits, vulnerabilities, internal conflicts, or vices?
  - **Quirks**: Detail their idiosyncrasies, habits, mannerisms, nervous tics, and unusual preferences.
  - **Values**: What is their moral code, personal philosophy, and guiding principles?
- **Motivations**: What are their underlying desires, goals, and needs? What are their conscious and unconscious drives?
- **Fears**: Describe their greatest anxieties, phobias, insecurities, and emotional triggers.
- **Skills/Abilities**: List their talents, learned skills, and any special powers they might have, including their level of proficiency.
- **Hobbies/Interests**: What are their pastimes, collections, and ways of spending free time?
- **Likes & Dislikes**: Provide a list of 5 specific and interesting likes and 5 dislikes. Be poetic, sensory, and specific. Avoid generic answers. Instead of "food," try "the taste of ozone after a thunderstorm" or "the specific silence of a library just before closing". Instead of "sunny days," try "sunlight that strips away shadows, leaving one exposed."
- **Daily Wear**: Based on the photo, describe their typical clothing style, accessories, practical considerations, and the condition and cultural significance of their clothing.
- **Backpack/Pockets**: What items do they carry regularly, and what do these items reveal about their personality and needs?
- **Speech Patterns**: How do they speak? Describe their accent, vocabulary, cadence, common phrases, and whether they tend to lie or have a stutter.

Photo: {{media url=photoDataUri}}`,
});

const generatePersonalityProfileFlow = ai.defineFlow(
  {
    name: 'generatePersonalityProfileFlow',
    inputSchema: GeneratePersonalityProfileInputSchema,
    outputSchema: GeneratePersonalityProfileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
