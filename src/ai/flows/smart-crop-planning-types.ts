import { z } from 'zod';

export const SmartCropPlanInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location to analyze.'),
  longitude: z.number().describe('The longitude of the location to analyze.'),
});
export type SmartCropPlanInput = z.infer<typeof SmartCropPlanInputSchema>;

export const SmartCropPlanOutputSchema = z.object({
  locationName: z.string().describe('The general name of the region being analyzed (e.g., "Thessalian Plain, Greece").'),
  soilAnalysis: z.object({
    type: z.string().describe('The likely soil type (e.g., Clay Loam, Sandy).'),
    ph: z.string().describe('An estimated pH range (e.g., "6.5 - 7.5 (Slightly Acidic to Neutral)").'),
    texture: z.string().describe('A brief description of the soil texture and structure.'),
    drainage: z.string().describe('An assessment of the likely drainage properties (e.g., "Good", "Poor", "Moderate").'),
  }).describe('Analysis of the soil properties.'),
  waterAnalysis: z.object({
      availability: z.string().describe('An estimation of water availability in the region (e.g., "Abundant", "Moderate", "Scarce").'),
      quality: z.string().describe('A general assessment of the likely water quality (e.g., "Good for irrigation", "May contain high salts").'),
      ph: z.string().describe('An estimated pH range for the local water (e.g., "7.0 - 8.0 (Neutral to Slightly Alkaline)").'),
      hardness: z.string().describe('An estimated water hardness (e.g., "Soft", "Moderately Hard", "Very Hard").'),
  }).describe('Analysis of the water resources.'),
  climateAnalysis: z.object({
    averageTemperatures: z.string().describe('Typical average temperatures for summer and winter (e.g., "Summer: 25-35°C, Winter: 5-15°C").'),
    frostRisk: z.string().describe('The risk of frost in the region (e.g., "Low", "Medium", "High with frequent occurrences in winter").'),
    growingSeason: z.string().describe('The typical length of the growing season (e.g., "Long, from March to November").'),
    annualRainfall: z.string().describe('Estimated average annual rainfall (e.g., "400-600 mm, mainly in autumn and winter").'),
  }).describe('Analysis of the local climate.'),
  nutrientAnalysis: z.object({
    general: z.string().describe('A general overview of likely nutrient levels (Nitrogen, Phosphorus, Potassium) based on the region.'),
    potentialDeficiencies: z.string().describe('Common nutrient deficiencies in this type of region/soil (e.g., "Nitrogen leaching in sandy soils, potential lack of Boron.").'),
    recommendations: z.string().describe('General recommendations for soil amendment or fertilization (e.g., "Incorporate organic matter to improve structure, consider a balanced NPK fertilizer.").'),
  }).describe('Analysis of potential soil nutrients and fertilization recommendations.'),
  cropRecommendations: z.array(z.object({
    crop: z.string().describe('The name of the recommended crop.'),
    suitability: z.string().describe('A suitability rating (e.g., "Excellent", "Good", "Moderate").'),
    reason: z.string().describe('A brief reason why this crop is suitable for the location and soil type.'),
  })).describe('A list of up to 5 recommended crops.'),
  pestAndDiseaseRisk: z.array(z.object({
    name: z.string().describe('The name of the potential pest or disease.'),
    riskLevel: z.string().describe('The estimated risk level (e.g., "High", "Medium", "Low").'),
    relevantCrops: z.string().describe('The recommended crops this pest/disease primarily affects.'),
    details: z.string().describe('Brief details about why the risk exists (e.g., "Favored by high humidity in spring").'),
  })).describe('A list of potential pest and disease risks for the recommended crops in this region.'),
  overallSummary: z.string().describe('A concise, overall summary and final advice for the user, starting with a disclaimer.'),
});
export type SmartCropPlanOutput = z.infer<typeof SmartCropPlanOutputSchema>;
