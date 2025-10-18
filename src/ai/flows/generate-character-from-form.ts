
'use server';

/**
 * @fileOverview This flow generates a detailed personality profile based on form input.
 *
 * - generateCharacterFromForm - A function that generates the personality profile from form data.
 * - GenerateCharacterFromFormInput - The input type for the function.
 * - GenerateCharacterFromFormOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GeneratePersonalityProfileOutputSchema } from '@/ai/schemas';

const GenerateCharacterFromFormInputSchema = z.object({
  name: z.string().describe("The character's name."),
  intro: z.string().describe("A brief introduction for the character. This is used for display purposes and should not influence the main personality generation."),
  personality: z.string().describe("A detailed description of the character's persona, traits, and how they interact with others. This is the primary source for their personality."),
  welcomeMessage: z.string().describe("The character's opening line. This should not be used to generate the main profile, but it can inform the character's speaking style."),
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person, as a data URI. This photo should be used to infer physical appearance and other visual cues."
    ),
});
export type GenerateCharacterFromFormInput = z.infer<typeof GenerateCharacterFromFormInputSchema>;

export type GenerateCharacterFromFormOutput = z.infer<
  typeof GeneratePersonalityProfileOutputSchema
>;

export async function generateCharacterFromForm(
  input: GenerateCharacterFromFormInput
): Promise<GenerateCharacterFromFormOutput> {
  return generateCharacterFromFormFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCharacterFromFormPrompt',
  input: {schema: GenerateCharacterFromFormInputSchema},
  output: {schema: GeneratePersonalityProfileOutputSchema},
  system: `You are an AI that crafts highly detailed, emotionally resonant, and rich personality profiles for characters. You are a master storyteller and character creator.`,
  prompt: `The character's name is {{{name}}}. 

You have been given a photo and several pieces of information to build a deep, compelling character profile.

**Primary Instructions:**
- **Personality Field**: The content of the 'Personality' field is your MOST IMPORTANT source. You MUST base the core of the character's identity, their traits, values, flaws, and interaction style on this description.
- **Photo Analysis**: Analyze the photo to determine the character's physical appearance (age, height, build, distinguishing marks), their typical clothing style (daily wear), and estimate their background from visual cues.
- **Welcome Message**: The 'Welcome Message' provides a strong hint about the character's speaking style (cadence, vocabulary, tone). Use it to inform the 'Speech Patterns' section.
- **Intro Field**: The 'Intro' field is for display purposes only. DO NOT use it to generate the profile.
- **Third-Person Narrative**: The entire response MUST be written in the third person.

Now, generate the full character profile.

Fill out the following template with rich, detailed information derived from the provided sources.

- **Age**: Estimate the character's actual age, apparent age, and stage of life based on the photo.
- **Height**: Estimate the character's height, perceived height, build, and posture from the photo.
- **Appearance**: Provide a brief overview of their appearance based on the photo, including key identifiers, notable features, distinguishing marks, overall attractiveness, grooming habits, and any prosthetics or modifications.
- **Biography**: Based on the **Personality** description and visual cues, invent a compelling backstory. Write a single cohesive narrative biography of at least 300 words. Cover their Early Life (birthplace, family background), key Turning Points (major life events), their Education/Training, and their Present Circumstances (current life, occupation, goals).
- **Significant Relationships**: Based on the **Personality** description, invent key relationships (family, friends, enemies, allies) and how these relationships influence them.
- **Personality**:
  - **Core Traits**: Use the provided **Personality** description as the source of truth. Describe their dominant personality aspects and general temperament. How are they perceived by others?
  - **Flaws**: Extract or infer negative traits, vulnerabilities, internal conflicts, or vices from the **Personality** description.
  - **Quirks**: Invent idiosyncrasies, habits, and mannerisms that are consistent with the **Personality** description.
  - **Values**: Determine their moral code, personal philosophy, and guiding principles from the **Personality** description.
- **Motivations**: What are their underlying desires, goals, and needs, based on the **Personality** description?
- **Fears**: Describe their greatest anxieties, phobias, and insecurities, consistent with the **Personality** description.
- **Skills/Abilities**: List their talents and learned skills, inferred from the **Personality** description.
- **Hobbies/Interests**: What are their pastimes and passions, derived from the **Personality** description?
- **Likes & Dislikes**: Provide a list of 5 specific and interesting likes and 5 dislikes that align with the **Personality** description.
- **Daily Wear**: Based on the photo, describe their typical clothing style and accessories.
- **Backpack/Pockets**: What items do they carry regularly that reflect their personality?
- **Speech Patterns**: Based on the **Welcome Message**, describe their accent, vocabulary, cadence, and common phrases.

---
**PROVIDED INFORMATION**

**Name**: {{{name}}}
**Personality**: {{{personality}}}
**Intro**: (For display only, do not use for generation) {{{intro}}}
**Welcome Message**: (Use for speech patterns) "{{{welcomeMessage}}}"
**Photo**: {{media url=photoDataUri}}
---
`,
});

const generateCharacterFromFormFlow = ai.defineFlow(
  {
    name: 'generateCharacterFromFormFlow',
    inputSchema: GenerateCharacterFromFormInputSchema,
    outputSchema: GeneratePersonalityProfileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
