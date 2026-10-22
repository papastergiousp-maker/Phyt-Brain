// src/ai/flows/examine-product-types.ts
// This file does NOT have 'use server';
// It contains Zod schemas and TypeScript types for the examineProduct flow.

import { z } from 'zod';

export const ExamineProductInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of an agricultural product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userContext: z.string().optional().describe('Optional additional context or question from the user about the product in the image, in Greek.'),
  conversationHistory: z.string().optional().describe('The history of the current conversation session to provide context.'),
  // The 'catalogData' field is removed from the public input schema.
  // It will now be sourced directly on the server.
});
export type ExamineProductInput = z.infer<typeof ExamineProductInputSchema>;

export const ExamineProductOutputSchema = z.object({
  productName: z.string().describe('Το όνομα του αναγνωρισμένου γεωργικού προϊόντος (στα Ελληνικά). Εάν δεν είσαι σίγουρος, ανάφερε την πιθανότερη ταυτοποίηση και τυχόν αβεβαιότητες. Πρέπει ΠΑΝΤΑ να ταυτοποιείς το φυτό.'),
  identifiedProblems: z.array(z.string()).describe('Μια σαφής λίστα με τα ονόματα των ασθενειών, παρασίτων ή ελλείψεων που εντοπίστηκαν, π.χ. ["Περονόσπορος", "Τετράνυχος"]. Αυτό το πεδίο είναι ΚΡΙΣΙΜΟ και πρέπει να περιέχει ΜΟΝΟ τα ονόματα των προβλημάτων. Αν το φυτό είναι υγιές, το πεδίο πρέπει να είναι κενό.'),
  analysis: z.string().describe("Λεπτομερής και εξαντλητική ανάλυση της κατάστασης του προϊόντος (στα Ελληνικά) που αιτιολογεί τα προβλήματα που βρέθηκαν. Πρέπει να περιγράψεις ΟΛΑ τα ορατά συμπτώματα. Εάν υπάρχουν πολλαπλά προβλήματα (π.χ. δύο ασθένειες ή μια ασθένεια και ένα παράσιτο), πρέπει να τα αναφέρεις και να τα αναλύσεις ΟΛΑ. Παράδειγμα: 'Το φύλλο παρουσιάζει κηλίδες περονόσπορου (λαδιές) και ταυτόχρονα αλευρώδη εξάνθηση ωιδίου.'"),
  advice: z.string().describe('Πρακτικές γεωπονικές συμβουλές για ΚΑΘΕ πρόβλημα που εντοπίστηκε (στα Ελληνικά). Πρέπει να εστιάσεις σε γενικές καλλιεργητικές πρακτικές (π.χ. "βελτιώστε τον αερισμό") και γενικές κατηγορίες θεραπειών (π.χ. "εξετάστε τη χρήση χαλκούχου μυκητοκτόνου"). Μην προτείνεις συγκεκριμένα εμπορικά ονόματα προϊόντων σε αυτό το στάδιο. Πάντα να συμπεριλαμβάνεις την αποποίηση ευθύνης στο τέλος.'),
});
export type ExamineProductOutput = z.infer<typeof ExamineProductOutputSchema>;

// Internal schema used by the prompt defined within examineProductFlow
// This schema now includes catalogData, which will be added on the server.
export const ExamineProductWithCatalogInputSchema = ExamineProductInputSchema.extend({
  catalogData: z.string().describe('The product catalog and plant disease information data for reference.'),
});
