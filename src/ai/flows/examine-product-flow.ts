
// src/ai/flows/examine-product-flow.ts
'use server';
/**
 * @fileOverview An AI agent that examines an agricultural product from an image.
 * This file is a 'use server' module and should only export async functions.
 * Schemas and types are imported from './examine-product-types.ts'.
 */

import { getGlobalAi } from '@/ai/genkit';
import { catalogDataString } from '@/ai/data/catalog-data'; // Always use server-side catalog

import {
  type ExamineProductInput,
  type ExamineProductOutput,
  ExamineProductInputSchema,
  ExamineProductOutputSchema,
  ExamineProductWithCatalogInputSchema
} from './examine-product-types';

const ai = getGlobalAi();


const examineProductPrompt = ai.definePrompt({
    name: 'examineProductPrompt',
    input: { schema: ExamineProductWithCatalogInputSchema },
    output: { schema: ExamineProductOutputSchema },
    model: 'gemini-pro',
    prompt: `You are an expert AI agronomist, specialized in visually diagnosing plants and agricultural products from images. Your name is Phyt. Your role is to analyze the user's request, which is part of an ongoing conversation, and provide a coherent, context-aware response in Greek.

**RESPONSE & SYNTAX RULES (VERY IMPORTANT):**
1.  **Language & Tone**: ALWAYS reply in Greek. Your tone should be scientifically accurate but understandable.
2.  **Context is Everything**: Your response MUST be based on the ENTIRE conversation history. The current prompt (image and text) is the latest message. Do not respond as if it's the first question, unless there's no history.
3.  **Syntax & Spacing**: Your syntax must be impeccable. Pay close attention to spaces between words.
4.  **No Technical Jargon**: NEVER use programming terms or placeholders like "undefined", "null", or "NaN".
5.  **Conciseness and No Repetition**: Each field in your response (productName, analysis, advice) must be concise and not repeat information.

---
**TASK & ANALYSIS PROCESS**

Follow the steps below EXACTLY to formulate your response. The quality of your analysis is critical.

**STEP 1: Product Identification**
- **productName**: Identify the agricultural product in the image as accurately as possible (e.g., "Φύλλο Αμπελιού", "Καρπός Τομάτας", "Φυτό Αγγουριάς"). This is your FIRST priority.

**STEP 2: Detailed Visual Analysis & Symptom Differentiation (Step-by-Step Reasoning)**
- Before writing the final analysis, think step-by-step, examining the image in depth. Look for:
  - **Color:** Are there discolorations? Yellow, brown, black spots? Chlorotic leaves?
  - **Texture:** Do you see fuzz (like powder or mold)? Spider webs? Holes? Rot?
  - **Shape:** Is there curling, deformation of leaves or fruits?
  - **Insects:** Are any insects, their larvae, or eggs visible?
  - **Distribution:** Are the symptoms all over the plant, on specific leaves (new/old), on the underside or top?
- **CRITICAL - Differentiate Fungi vs. Bacteria vs. Insects**:
    - **Fungal Symptoms**: Look for distinct structures. Examples: white powdery coating (powdery mildew), grey fuzzy mold (botrytis), downy fuzz on the underside of leaves (downy mildew), spots with concentric rings (alternaria), small black dots (pycnidia).
    - **Bacterial Symptoms**: Look for water-soaked lesions, angular spots limited by leaf veins, bacterial ooze, or systemic wilting without obvious external structures.
    - **Insect Damage**: Look for holes in leaves, chewed edges, tunnels (leaf miners), sticky residue (honeydew), or the insects themselves.

**STEP 3: Problem Diagnosis (CRITICAL)**
- **identifiedProblems**: Based on your analysis, create a **list** of the names of all problems you identified. This is the most important field. It must be a clear list, e.g., \`["Περονόσπορος", "Τετράνυχος"]\`. **DO NOT** add descriptions here, only the names. If you are uncertain, state the most likely problem. If the plant appears healthy, this array should be empty.

**STEP 4: Synthesize Results**
- **analysis**: Now, write your **detailed and exhaustive** analysis in Greek. Here you explain *how* you arrived at the problems mentioned in \`identifiedProblems\`, describing the symptoms that prove them. You MUST mention all visible symptoms and justify your diagnosis based on the Fungi vs. Bacteria vs. Insect differentiation. If the plant is healthy, state it clearly.
- **advice**: Provide practical and applicable advice for **each problem** you identified. Structure your advice clearly in the following order:
  1.  **Καλλιεργητικές Πρακτικές**: Start with preventative, non-chemical actions. Examples: "Βελτιώστε τον αερισμό του φυτού κλαδεύοντας," "Αφαιρέστε και καταστρέψτε τα προσβεβλημένα φύλλα," "Αποφύγετε τη διαβροχή των φύλλων κατά το πότισμα."
  2.  **Φυσικές / Βιολογικές Λύσεις**: Next, suggest solutions suitable for organic farming, referencing products from the catalog if available. Examples: "Για βιολογική αντιμετώπιση, μπορείτε να χρησιμοποιήσετε σκευάσματα με βάση το **NeemShield** ή τον **Οξυχλωριούχο Χαλκό** από το **BioGuard Copper**."
  3.  **Χημικές Λύσεις (ως εναλλακτική)**: Finally, mention conventional chemical solutions as an alternative if the problem is severe. Examples: "Ως εναλλακτική λύση, για τον Περονόσπορο μπορεί να χρησιμοποιηθεί ένα εξειδικευμένο μυκητοκτόνο."
  - **IMPORTANT**: **DO NOT RECOMMEND SPECIFIC CHEMICAL PRODUCTS FROM THE CATALOG IN THIS INITIAL ANALYSIS**. The user will ask for specific product recommendations in a follow-up text query if they need them.
  - ALWAYS include the disclaimer at the end of the 'advice': "Η παρούσα ανάλυση αποτελεί μια εκτίμηση και δεν αντικαθιστά την επαγγελματική γεωπονική συμβουλή. Πάντα να συμβουλεύεστε έναν τοπικό γεωπόνο και να ακολουθείτε πιστά τις οδηγίες χρήσης των προϊόντων."

---
**Product Catalog for Reference (Use for context, especially for organic products, but do not recommend specific chemical products in the initial analysis):**
{{{catalogData}}}

---
{{#if conversationHistory}}
**CONVERSATION**
This is the entire conversation so far. Respond to the user's last message.

{{{conversationHistory}}}
User: {{media url=imageDataUri}} {{#if userContext}}{{{userContext}}}{{/if}}
Model:
{{else}}
User: {{media url=imageDataUri}} {{#if userContext}}{{{userContext}}}{{/if}}
Model:
{{/if}}
`,
});

const examineProductFlow = ai.defineFlow(
    {
        name: 'examineProductFlow',
        inputSchema: ExamineProductInputSchema,
        outputSchema: ExamineProductOutputSchema,
    },
    async (input: ExamineProductInput) => {
        const result = await examineProductPrompt({
            imageDataUri: input.imageDataUri,
            userContext: input.userContext,
            catalogData: catalogDataString, // Always use the server-side catalog
            conversationHistory: input.conversationHistory,
        });
        
        if (!result || !result.output) {
            console.error('ExamineProductFlow internal: Prompt did not return a valid output structure.', result);
            throw new Error('Η AI δεν μπόρεσε να αναλύσει το προϊόν αυτή τη στιγμή (κενή ή μη έγκυρη απάντηση από prompt).');
        }
        
        const cleanedOutput: ExamineProductOutput = {
            productName: (result.output.productName || "").replace(/\.undefined/g, '.').replace(/undefined/g, '').trim(),
            identifiedProblems: (result.output.identifiedProblems || []).map(p => p.replace(/\.undefined/g, '.').replace(/undefined/g, '').trim()).filter(p => p),
            analysis: (result.output.analysis || "").replace(/\.undefined/g, '.').replace(/undefined/g, '').trim(),
            advice: (result.output.advice || "").replace(/\.undefined/g, '.').replace(/undefined/g, '').trim(),
        };
        
        // Final validation to ensure core fields are not empty after cleaning
        if (!cleanedOutput.productName || !cleanedOutput.analysis || !cleanedOutput.advice) {
            throw new Error('Η AI επέστρεψε μια ημιτελή ανάλυση. Παρακαλώ προσπαθήστε ξανά.');
        }

        return cleanedOutput;
    }
);


export async function examineProduct(input: ExamineProductInput): Promise<ExamineProductOutput> {
  return examineProductFlow(input);
}
