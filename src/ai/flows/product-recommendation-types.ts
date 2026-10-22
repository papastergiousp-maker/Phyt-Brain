// src/ai/flows/product-recommendation-types.ts
import { z } from 'zod';

export const ProductRecommendationInputSchema = z.object({
  selectedProductsText: z.string().describe('A summary of the products the user has already selected for their order.'),
  productionType: z.string().optional().describe('The type of crop or production (e.g., "Τομάτα", "Αμπέλι").'),
  catalogData: z.string().describe('The full product catalog data for reference.'),
});
export type ProductRecommendationInput = z.infer<typeof ProductRecommendationInputSchema>;

export const ProductRecommendationOutputSchema = z.object({
  recommendations: z.array(z.string()).describe('A list of recommendations based on the selected products. These could be complementary products, warnings about combinations, or general advice.'),
});
export type ProductRecommendationOutput = z.infer<typeof ProductRecommendationOutputSchema>;
