// src/ai/flows/extract-order-from-audio-types.ts
import { z } from 'zod';
import { ExtractedItemSchema } from './extract-order-from-image-types'; // Re-use this schema

export const ExtractOrderFromAudioInputSchema = z.object({
  audioDataUri: z.string().describe("A voice recording of an order, as a data URI."),
  catalogData: z.string().describe('The product catalog data for reference.'),
});
export type ExtractOrderFromAudioInput = z.infer<typeof ExtractOrderFromAudioInputSchema>;

export const ExtractOrderFromAudioOutputSchema = z.object({
    items: z.array(ExtractedItemSchema).describe("A list of all identified products and their quantities from the audio."),
    notes: z.string().optional().describe('Any other notes, comments, or unidentifiable items from the audio.'),
    transcription: z.string().describe('The full transcription of the audio recording.'),
});
export type ExtractOrderFromAudioOutput = z.infer<typeof ExtractOrderFromAudioOutputSchema>;
