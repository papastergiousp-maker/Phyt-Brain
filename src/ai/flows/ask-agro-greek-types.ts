// src/ai/flows/ask-agro-greek-types.ts
// This file does NOT have 'use server';
// It contains Zod schemas and TypeScript types for the askAgroGreek flow.

import { z } from 'zod';

export const AskAgroGreekInputSchema = z.object({
  question: z.string().describe('The agricultural question asked by the user.'),
  latitude: z.number().optional().describe('Optional: The user\'s current latitude for weather-related queries.'),
  longitude: z.number().optional().describe('Optional: The user\'s current longitude for weather-related queries.'),
  conversationHistory: z.string().optional().describe('The history of the current conversation session to provide context.'),
  // catalogData is removed from public input, will be added on server.
});
export type AskAgroGreekInput = z.infer<typeof AskAgroGreekInputSchema>;

export const AskAgroGreekOutputSchema = z.object({
  answer: z.string().describe('The agricultural advice or answer, in Greek. If product recommendations are made, they will be included here along with a disclaimer. If weather information is fetched, it will be integrated into the answer. If PDF text was provided and used, the answer should reflect that context.'),
  imageUrl: z.string().nullable().optional().describe('An optional data URI of a generated image, if the user requested a visual representation.'),
});
export type AskAgroGreekOutput = z.infer<typeof AskAgroGreekOutputSchema>;

// Internal schema used by the prompt defined within askAgroGreekFlow
export const AgroGreekPromptInternalInputSchema = z.object({
  question: AskAgroGreekInputSchema.shape.question,
  catalogData: z.string().describe('The product catalog and plant disease information data for reference.'),
  latitude: AskAgroGreekInputSchema.shape.latitude,
  longitude: AskAgroGreekInputSchema.shape.longitude,
  conversationHistory: AskAgroGreekInputSchema.shape.conversationHistory,
});
