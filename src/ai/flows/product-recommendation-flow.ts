
// src/ai/flows/product-recommendation-flow.ts
'use server';
/**
 * @fileOverview An AI agent that provides recommendations based on selected products.
 */

import { getGlobalAi } from '@/ai/genkit';
import {
  type ProductRecommendationInput,
  type ProductRecommendationOutput,
  ProductRecommendationInputSchema,
  ProductRecommendationOutputSchema,
} from './product-recommendation-types';

const ai = getGlobalAi();


const productRecommendationPrompt = ai.definePrompt({
    name: 'productRecommendationPrompt',
    input: { schema: ProductRecommendationInputSchema },
    output: { schema: ProductRecommendationOutputSchema },
    model: 'gemini-pro',
    prompt: `Είσαι ένας έμπειρος γεωπόνος AI. Ο χρήστης έχει επιλέξει τα παρακάτω προϊόντα για μια παραγγελία. 
    Ο στόχος σου είναι να παρέχεις 3-4 χρήσιμες, σύντομες και σχετικές προτάσεις.

    **Κανόνες:**
    1.  **Σχετικότητα**: Οι προτάσεις πρέπει να είναι σχετικές με τα προϊόντα που έχουν ήδη επιλεγεί ή τον τύπο παραγωγής.
    2.  **Συνέργεια**: Πρότεινε προϊόντα που συμπληρώνουν τα ήδη επιλεγμένα. Για παράδειγμα, αν ο χρήστης επέλεξε ένα ζιζανιοκτόνο, πρότεινε ένα κατάλληλο λίπασμα ή έναν βιοδιεγέρτη για να βοηθήσει την καλλιέργεια να ξεπεράσει το στρες.
    3.  **Προειδοποιήσεις**: Αν κάποιος συνδυασμός προϊόντων είναι ασύμβατος ή επικίνδυνος, προειδοποίησε τον χρήστη.
    4.  **Γενικές Συμβουλές**: Δώσε μια γενική συμβουλή, π.χ., "Μην ξεχνάτε τη χρήση προσκολλητικού για καλύτερη αποτελεσματικότητα" ή "Εναλλάσσετε δραστικές ουσίες για να αποφύγετε την ανθεκτικότητα."
    5.  **Μην Επαναλαμβάνεις**: Μην προτείνεις προϊόντα που ο χρήστης έχει ήδη επιλέξει.
    6.  **Γλώσσα**: Πάντα στα Ελληνικά.
    7.  **Μορφή**: Κάθε πρόταση πρέπει να είναι ένα ξεχωριστό string μέσα στον πίνακα 'recommendations'.

    **Δεδομένα από τον χρήστη:**
    -   **Επιλεγμένα Προϊόντα**:
        {{{selectedProductsText}}}
    -   **Τύπος Παραγωγής (αν υπάρχει)**: {{{productionType}}}

    **Διαθέσιμος Κατάλογος για Αναφορά**:
    {{{catalogData}}}

    Παράδειγμα απάντησης:
    {
        "recommendations": [
            "Για την ενίσχυση της καλλιέργειας μετά την εφαρμογή ζιζανιοκτόνου, εξετάστε τη χρήση του βιοδιεγέρτη ISABION.",
            "Το προσκολλητικό STICKER μπορεί να βελτιώσει την αποτελεσματικότητα των ψεκασμών σας.",
            "Βεβαιωθείτε ότι ο εξοπλισμός ψεκασμού είναι καθαρός πριν από κάθε χρήση."
        ]
    }
    `,
});

const productRecommendationFlow = ai.defineFlow(
    {
        name: 'productRecommendationFlow',
        inputSchema: ProductRecommendationInputSchema,
        outputSchema: ProductRecommendationOutputSchema,
    },
    async (input) => {
        const { output } = await productRecommendationPrompt(input);
        if (!output?.recommendations || output.recommendations.length === 0) {
            return {
                recommendations: ['Δεν υπάρχουν συγκεκριμένες προτάσεις αυτή τη στιγμή. Πάντα να ακολουθείτε τις οδηγίες της ετικέτας.'],
            };
        }
        return output;
    }
);


export async function getProductRecommendations(input: ProductRecommendationInput): Promise<ProductRecommendationOutput> {
  return productRecommendationFlow(input);
}
