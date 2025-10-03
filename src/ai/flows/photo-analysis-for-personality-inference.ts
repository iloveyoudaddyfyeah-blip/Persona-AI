'use server';
/**
 * @fileOverview Analyzes an uploaded photo to infer personality traits and background information.
 *
 * - analyzePhotoForPersonality - A function that analyzes the photo and returns personality traits and background information.
 * - PhotoAnalysisInput - The input type for the analyzePhotoForPersonality function.
 * - PhotoAnalysisOutput - The return type for the analyzePhotoForPersonality function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PhotoAnalysisInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type PhotoAnalysisInput = z.infer<typeof PhotoAnalysisInputSchema>;

const PhotoAnalysisOutputSchema = z.object({
  personalityTraits: z
    .string()
    .describe('Inferred personality traits based on the photo.'),
  backgroundInformation: z
    .string()
    .describe('Relevant background information inferred from the photo.'),
});
export type PhotoAnalysisOutput = z.infer<typeof PhotoAnalysisOutputSchema>;

export async function analyzePhotoForPersonality(
  input: PhotoAnalysisInput
): Promise<PhotoAnalysisOutput> {
  return analyzePhotoForPersonalityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'photoAnalysisPrompt',
  input: {schema: PhotoAnalysisInputSchema},
  output: {schema: PhotoAnalysisOutputSchema},
  prompt: `Analyze the following photo to infer personality traits and background information about the person in the photo.\n\nPhoto: {{media url=photoDataUri}}\n\nFocus on facial features, attire, and background details to determine personality traits and any relevant background information.  Do not mention the specific features, attire, background, etc. that led you to your conclusion. Just provide the conclusion.\n\nOutput the personality traits and background information as separate strings.  The background information should be very specific and informative. Limit to 100 words each.\n\nPersonality Traits:\n{{output.personalityTraits}}\n\nBackground Information:\n{{output.backgroundInformation}}`,
});

const analyzePhotoForPersonalityFlow = ai.defineFlow(
  {
    name: 'analyzePhotoForPersonalityFlow',
    inputSchema: PhotoAnalysisInputSchema,
    outputSchema: PhotoAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
