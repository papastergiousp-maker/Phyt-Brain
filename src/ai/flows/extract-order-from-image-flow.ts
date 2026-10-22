
// src/ai/flows/extract-order-from-image-flow.ts
'use server';
/**
 * @fileOverview An AI agent that extracts order details from an image.
 */

import { getGlobalAi } from '@/ai/genkit';
import {
  type ExtractOrderFromImageInput,
  type ExtractOrderFromImageOutput,
  ExtractOrderFromImageInputSchema,
  ExtractOrderFromImageOutputSchema,
} from './extract-order-from-image-types';

const ai = getGlobalAi();

const extractOrderPrompt = ai.definePrompt({
  name: 'extractOrderPrompt',
  input: { schema: ExtractOrderFromImageInputSchema },
  output: { schema: ExtractOrderFromImageOutputSchema },
  model: 'gemini-pro',
  prompt: `You are a highly accurate optical character recognition (OCR) and data extraction assistant for an agricultural supply store. Your task is to analyze an image of an order, which may be handwritten or typed, and extract the product names and their quantities.

  **Instructions:**
  1.  **Analyze the Image**: Carefully examine the provided image.
      - Image: {{media url=imageDataUri}}
  2.  **Identify Products and Quantities**: Read each line to identify product names and the corresponding quantity. Quantities might be numbers (e.g., "2"), or include units (e.g., "5 κουτιά", "1L").
  3.  **Product Name Matching**: The user has provided a catalog. Your primary goal is to match the names you read from the image to the official product names in the provided catalog. Be flexible with minor spelling variations or abbreviations. For example, if the image says "Karate", and the catalog has "KARATE® 2.5 WG", you should identify it as "KARATE® 2.5 WG".
  4.  **Structure the Output**:
      - For each identified product, create an item in the 'items' array with the matched 'productName' from the catalog and the 'quantity' as seen in the image.
      - If you find any text that seems like a general note, a customer name, or an item you cannot identify from the catalog, add it to the 'notes' field.
  5.  **Be Thorough**: Extract all identifiable items from the list. If a line is illegible, mention it in the notes.

  **Product Catalog for Reference:**
  {{{catalogData}}}
  `,
});

const extractOrderFlow = ai.defineFlow(
  {
    name: 'extractOrderFlow',
    inputSchema: ExtractOrderFromImageInputSchema,
    outputSchema: ExtractOrderFromImageOutputSchema,
  },
  async (input) => {
    // This flow *requires* the catalog to match product names.
    const { output } = await extractOrderPrompt(input);
    if (!output) {
      throw new Error('The AI could not extract any data from the image.');
    }
    return output;
  }
);

export async function extractOrderFromImage(input: ExtractOrderFromImageInput): Promise<ExtractOrderFromImageOutput> {
    return extractOrderFlow(input);
}
