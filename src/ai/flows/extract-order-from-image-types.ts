// src/ai/flows/extract-order-from-image-types.ts
import { z } from 'zod';

export const ExtractOrderFromImageInputSchema = z.object({
  imageDataUri: z.string().describe("A photo of an order list, as a data URI."),
  catalogData: z.string().describe('The product catalog data for reference.'),
});
export type ExtractOrderFromImageInput = z.infer<typeof ExtractOrderFromImageInputSchema>;

export const ExtractedItemSchema = z.object({
    productName: z.string().describe("The name of the product as identified from the image. Should match a name from the catalog as closely as possible."),
    quantity: z.string().describe('The quantity for the product, including units if specified (e.g., "2", "5 κουτιά", "1L").'),
});

export const ExtractOrderFromImageOutputSchema = z.object({
    items: z.array(ExtractedItemSchema).describe("A list of all identified products and their quantities."),
    notes: z.string().optional().describe('Any other handwritten notes, comments, or unidentifiable items from the order list.'),
});
export type ExtractOrderFromImageOutput = z.infer<typeof ExtractOrderFromImageOutputSchema>;
