
// src/ai/flows/extract-order-from-audio-flow.ts
'use server';
/**
 * @fileOverview An AI agent that extracts order details from an audio recording.
 */

import { getGlobalAi } from '@/ai/genkit';
import {
  type ExtractOrderFromAudioInput,
  type ExtractOrderFromAudioOutput,
  ExtractOrderFromAudioInputSchema,
  ExtractOrderFromAudioOutputSchema,
} from './extract-order-from-audio-types';

const ai = getGlobalAi();

const extractOrderFromAudioPrompt = ai.definePrompt({
  name: 'extractOrderFromAudioPrompt',
  input: { schema: ExtractOrderFromAudioInputSchema },
  output: { schema: ExtractOrderFromAudioOutputSchema },
  model: 'gemini-pro',
  prompt: `You are a highly accurate voice-to-text and data extraction assistant for an agricultural supply store. Your task is to analyze an audio recording of an order and perform a two-step process:

  **Step 1: Transcribe the Audio**
  - First, accurately transcribe the entire audio recording. The transcription should be as verbatim as possible. The audio is provided here: {{media url=audioDataUri}}.
  - Place this full transcription into the 'transcription' output field.

  **Step 2: Extract Order Details from Transcription**
  - Next, carefully analyze the transcription you just created.
  - Identify all product names and their corresponding quantities. Quantities might be numbers (e.g., "δύο"), or include units (e.g., "πέντε κουτιά", "ένα λίτρο").
  - Use the provided product catalog below to match the product names you hear. Be flexible with minor variations or abbreviations, but match to the official product name from the catalog. For example, if the audio says "Κορατζεν", you should identify it as "Coragen® 20 SC".
  - For each identified product, create an item in the 'items' array with the matched 'productName' from the catalog and the 'quantity' as heard in the audio.
  - If you hear any text that seems like a general note or a customer name, add it to the 'notes' field.

  **Product Catalog for Reference:**
  {{{catalogData}}}
  `,
});

const extractOrderFromAudioFlow = ai.defineFlow(
  {
    name: 'extractOrderFromAudioFlow',
    inputSchema: ExtractOrderFromAudioInputSchema,
    outputSchema: ExtractOrderFromAudioOutputSchema,
  },
  async (input) => {
    const { output } = await extractOrderFromAudioPrompt(input);
    if (!output) {
      throw new Error('The AI could not extract any data from the audio recording.');
    }
    return output;
  }
);

export async function extractOrderFromAudio(input: ExtractOrderFromAudioInput): Promise<ExtractOrderFromAudioOutput> {
    return extractOrderFromAudioFlow(input);
}
