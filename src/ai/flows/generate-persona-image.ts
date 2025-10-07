
'use server';
/**
 * @fileOverview A flow for generating an image for a user persona.
 *
 * - generatePersonaImage - A function that takes a prompt and returns an image data URI.
 * - GeneratePersonaImageInput - The input type for the function.
 * - GeneratePersonaImageOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonaImageInputSchema = z.object({
  prompt: z.string().describe('A text prompt describing the desired image.'),
});
export type GeneratePersonaImageInput = z.infer<
  typeof GeneratePersonaImageInputSchema
>;

const GeneratePersonaImageOutputSchema = z.object({
  photoDataUri: z.string().describe('The generated image as a data URI.'),
});
export type GeneratePersonaImageOutput = z.infer<
  typeof GeneratePersonaImageOutputSchema
>;

export async function generatePersonaImage(
  input: GeneratePersonaImageInput
): Promise<GeneratePersonaImageOutput> {
  return generatePersonaImageFlow(input);
}

const generatePersonaImageFlow = ai.defineFlow(
  {
    name: 'generatePersonaImageFlow',
    inputSchema: GeneratePersonaImageInputSchema,
    outputSchema: GeneratePersonaImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `A high-quality, detailed portrait of a character. ${input.prompt}. Cinematic, dramatic lighting.`,
      config: {
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        ],
      },
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed.');
    }
    
    return {
      photoDataUri: media.url,
    };
  }
);
