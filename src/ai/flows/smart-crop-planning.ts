
// src/ai/flows/smart-crop-planning.ts
'use server';
/**
 * @fileOverview AI flow for analyzing a geographical location for agricultural purposes.
 */

import { getGlobalAi } from '@/ai/genkit';
import {
  type SmartCropPlanInput,
  type SmartCropPlanOutput,
  SmartCropPlanInputSchema,
  SmartCropPlanOutputSchema,
} from './smart-crop-planning-types';

const ai = getGlobalAi();

const smartCropPlanPrompt = ai.definePrompt({
  name: 'smartCropPlanPrompt',
  input: { schema: SmartCropPlanInputSchema },
  output: { schema: SmartCropPlanOutputSchema },
  model: 'gemini-pro',
  prompt: `You are an expert agronomist and soil scientist AI. Your name is Phyt. Your task is to provide a detailed analysis of a specific geographical location for agricultural planning, based on the provided latitude and longitude.

**CRITICAL FIRST STEP: You MUST first determine if the location is on land or in a body of water (ocean, sea, lake, river). This is the most important step.**

- **If the location is a body of water**, you MUST STOP all further analysis. Your entire response must be structured as follows and contain NO other information:
    - 'locationName': "Υδάτινο Σώμα" (or the specific name like "Aegean Sea").
    - 'soilAnalysis.type': "Υδάτινο Σώμα".
    - 'soilAnalysis.ph': "N/A".
    - 'soilAnalysis.texture': "N/A".
    - 'soilAnalysis.drainage': "N-A".
    - 'waterAnalysis.availability': "N/A",
    - 'waterAnalysis.quality': "N/A",
    - 'waterAnalysis.ph': "N/A",
    - 'waterAnalysis.hardness': "N/A",
    - 'climateAnalysis': { 'averageTemperatures': "N/A", 'frostRisk': "N/A", 'growingSeason': "N/A", 'annualRainfall': "N/A" },
    - 'nutrientAnalysis': { 'general': "Η ανάλυση δεν είναι δυνατή σε υδάτινες εκτάσεις.", 'potentialDeficiencies': "N/A", 'recommendations': "N/A" },
    - 'cropRecommendations': [] (an empty array).
    - 'pestAndDiseaseRisk': [] (an empty array).
    - 'overallSummary': "Η επιλεγμένη τοποθεσία φαίνεται να είναι σε υδάτινο σώμα (θάλασσα, λίμνη ή ποτάμι). Παρακαλώ, επιλέξτε ένα σημείο στην ξηρά για να λάβετε μια γεωργική ανάλυση.".
- **If the location is on land**, and only if it is on land, then proceed with the detailed analysis below.

**IMPORTANT:** Your entire response MUST be in Greek.

**Location for Analysis:**
- Latitude: {{{latitude}}}
- Longitude: {{{longitude}}}

**Analysis Steps & Output Structure (Only if on Land):**

1.  **Identify Location (\`locationName\`):**
    -   **MOST IMPORTANT STEP:** Based on the coordinates, determine the specific geographical region (e.g., "Thessalian Plain, Greece", "Kopais Plain, Boeotia, Greece").
    -   **YOU MUST use this identified location as the sole context for all subsequent analysis steps.** Do not provide information for any other region.

2.  **Soil Analysis (\`soilAnalysis\`):**
    -   Estimate the dominant soil type in the identified region (e.g., Clay Loam, Sandy, Silty, etc.).
    -   Provide an estimated pH range for that region.
    -   Briefly describe the likely soil texture for that region.
    -   Assess the drainage potential for that region.

3.  **Water Resource Analysis (\`waterAnalysis\`):**
    -   Estimate the regional water availability in the identified region.
    -   Assess the general water quality for irrigation in the identified region.
    -   Provide an estimated pH range for the water in the identified region.
    -   Estimate the water hardness in the identified region.

4.  **Climate Analysis (\`climateAnalysis\`):**
    -   Estimate the typical average temperatures for summer and winter.
    -   Describe the frost risk.
    -   Define the typical length of the growing season.
    -   Estimate the average annual rainfall.

5.  **Nutrient Analysis (\`nutrientAnalysis\`):**
    -   **General:** Give a general overview of expected nutrient levels (N, P, K) for the identified region and soil type.
    -   **Potential Deficiencies:** List common nutrient deficiencies for this soil type and region.
    -   **Recommendations:** Provide general advice for soil improvement and fertilization relevant to the identified region and crops.

6.  **Crop Recommendations (\`cropRecommendations\`):**
    -   Based on ALL the above factors for the **identified region**, recommend up to 5 suitable crops.
    -   **CRITICAL:** The 'suitability' rating MUST be one of the following Greek words: "Εξαιρετική", "Καλή", or "Μέτρια". Do not use English words.
    -   For each crop, provide its name, a suitability rating, and a brief reason.

7.  **Pest and Disease Risk (\`pestAndDiseaseRisk\`):**
    -   For the top recommended crops, identify 2-3 common pests or diseases for the region.
    -   Estimate a risk level ("High", "Medium", "Low") for each.
    -   List the crops they primarily affect.
    -   Provide brief details on why the risk exists.

8.  **Overall Summary (\`overallSummary\`):**
    -   Provide a final, concise summary. **Start with the disclaimer:** "ΣΗΜΑΝΤΙΚΗ ΣΗΜΕΙΩΣΗ: Η παρούσα ανάλυση αποτελεί μια εκτίμηση βασισμένη σε γενικά γεωγραφικά και κλιματολογικά δεδομένα και δεν αντικαθιστά μια φυσική ανάλυση εδάφους και νερού. Για ακριβή αποτελέσματα, συνιστάται πάντοτε η αποστολή δείγματος σε εξειδικευμένο εργαστήριο."
    -   Then, summarize the key findings for the identified region and provide a concluding piece of advice.
`,
});

const smartCropPlanFlow = ai.defineFlow(
  {
    name: 'smartCropPlanFlow',
    inputSchema: SmartCropPlanInputSchema,
    outputSchema: SmartCropPlanOutputSchema,
  },
  async (input) => {
    const { output } = await smartCropPlanPrompt(input);
    if (!output) {
      throw new Error('The AI could not generate a crop plan for the location.');
    }
    return output;
  }
);

export async function getSmartCropPlan(input: SmartCropPlanInput): Promise<SmartCropPlanOutput> {
  return smartCropPlanFlow(input);
}
