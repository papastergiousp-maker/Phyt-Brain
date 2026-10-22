
// src/ai/tools/generate-plant-image-tool.ts
'use server';
/**
 * @fileOverview A Genkit tool for generating images of plants.
 */

import { getGlobalAi } from '@/ai/genkit';
import { z } from 'zod';

const GeneratePlantImageInputSchema = z.object({
  prompt: z.string().describe('A detailed English description for the image generation model. Example: "A photorealistic image of a grape leaf with white, powdery spots of Powdery Mildew fungus."'),
});

const GeneratePlantImageOutputSchema = z.object({
  imageUrl: z.string().describe('A data URI of the generated image. Expected format: \'data:image/png;base64,<encoded_data>\'.'),
});

const ai = getGlobalAi();

export const generatePlantImageTool = ai.defineTool(
  {
    name: 'generatePlantImageTool',
    description: 'Generates a photorealistic image of a plant, disease, or pest based on a textual description. Use this when the user asks for a visual representation.',
    inputSchema: GeneratePlantImageInputSchema,
    outputSchema: GeneratePlantImageOutputSchema,
  },
  async (input) => {
    try {
      console.log(`[Image Gen Tool] Received prompt: ${input.prompt}`);
      
      const { media } = await ai.generate({
        model: 'gemini-pro',
        prompt: `Create a photorealistic, high-resolution, detailed image of the following agricultural subject. The image should be clear and suitable for identifying plant issues. Do not include any text or labels in the image itself. Subject: ${input.prompt}`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (!media?.url) {
        throw new Error('Image generation failed to produce an image.');
      }
      
      console.log('[Image Gen Tool] Image generated successfully.');
      return { imageUrl: media.url };

    } catch (error) {
      console.error('[Image Gen Tool] Error:', error);
      throw new Error('Failed to generate image. The model might be unavailable or the prompt could not be processed.');
    }
  }
);
