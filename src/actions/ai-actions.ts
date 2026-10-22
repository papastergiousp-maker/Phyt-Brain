
// src/actions/ai-actions.ts
'use server';

import { askAgroGreek } from '@/ai/flows/ask-agro-greek-flow';
import { examineProduct } from '@/ai/flows/examine-product-flow';
import { getProductRecommendations } from '@/ai/flows/product-recommendation-flow';
import { extractOrderFromImage } from '@/ai/flows/extract-order-from-image-flow';
import { extractOrderFromAudio } from '@/ai/flows/extract-order-from-audio-flow';
import { getSmartCropPlan } from '@/ai/flows/smart-crop-planning';
import { serverConfig } from '@/config/server-config';


import type { AskAgroGreekInput, AskAgroGreekOutput } from '@/ai/flows/ask-agro-greek-types';
import type { ExamineProductInput, ExamineProductOutput } from '@/ai/flows/examine-product-types';
import type { ProductRecommendationInput, ProductRecommendationOutput } from '@/ai/flows/product-recommendation-types';
import type { ExtractOrderFromImageInput, ExtractOrderFromImageOutput } from '@/ai/flows/extract-order-from-image-types';
import type { ExtractOrderFromAudioInput, ExtractOrderFromAudioOutput } from '@/ai/flows/extract-order-from-audio-types';
import type { SmartCropPlanInput, SmartCropPlanOutput } from '@/ai/flows/smart-crop-planning-types';


/**
 * A robust check for retryable errors like rate limits or temporary service unavailability.
 * @param error The error object to inspect.
 * @returns True if the error appears to be a retryable error.
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;

  // Convert the error to a string representation to catch various formats.
  const errorString = (typeof error === 'object' ? JSON.stringify(error) : String(error)).toLowerCase();
  
  const keywords = [
    '429', // HTTP status code for rate limiting
    '503', // HTTP status code for service unavailable
    'rate limit',
    'quota',
    'resource has been exhausted',
    'too many requests',
    'service unavailable',
    'user_rate_limit_exceeded', // Specific code from some APIs
  ];

  return keywords.some(keyword => errorString.includes(keyword));
}

// A single function to check for the API key and throw a clear error.
function checkApiKey() {
  if (!serverConfig.geminiApiKey) {
    throw new Error("Το κλειδί API της Google (GEMINI_API_KEY) δεν έχει οριστεί στις μεταβλητές περιβάλλοντος του server. Η λειτουργία του Phyt δεν είναι διαθέσιμη χωρίς αυτό.");
  }
}

async function withRetries<T>(
  action: () => Promise<T>,
  handleError: (error: any) => { error: string }
): Promise<T | { error: string }> {
  let retries = 3;
  let delay = 1000; // Start with 1 second

  while (retries > 0) {
    try {
      // First, check for the API key availability. This is the crucial check.
      checkApiKey();
      return await action(); // Success, return the result
    } catch (error: any) {
      if (isRetryableError(error) && retries > 1) {
        console.log(`Retryable error hit. Retrying in ${delay / 1000}s... (${retries - 1} retries left)`);
        await new Promise(res => setTimeout(res, delay));
        retries--;
        delay *= 2; // Exponential backoff
      } else {
        // This is the last retry or a different kind of error, so handle it and exit.
        return handleError(error);
      }
    }
  }

  // This part is reached only if all retries fail.
  return handleError(new Error('The AI service is still unavailable after multiple retries.'));
}

const handleGenericAiError = (error: any, context: 'advice' | 'examination' | 'recommendation' | 'order_extraction' | 'order_extraction_audio' | 'crop_planning'): { error: string } => {
  console.error(`Error in AI action (${context}). Raw Error Object:`, error);
  console.error("Error message (if any):", error?.message);
  
  const errorMessageLower = (error?.message || '').toLowerCase();

  // Handle specific missing API Key error first, as thrown by our code
  if (errorMessageLower.includes('gemini_api_key) δεν έχει οριστεί')) {
    return { error: error.message };
  }
  
  // Use the robust checker for retryable errors.
  if (isRetryableError(error)) {
      const msg = context === 'advice' 
          ? 'Η υπηρεσία του Phyt είναι προσωρινά μη διαθέσιμη' 
          : context === 'examination' 
          ? 'Η υπηρεσία ανάλυσης εικόνας του Phyt είναι προσωρινά μη διαθέσιμη'
          : context === 'order_extraction'
          ? 'Η υπηρεσία ανάλυσης παραγγελίας του Phyt είναι προσωρινά μη διαθέσιμη'
          : context === 'order_extraction_audio'
          ? 'Η υπηρεσία ανάλυσης ηχογράφησης του Phyt είναι προσωρινά μη διαθέσιμη'
          : context === 'crop_planning'
          ? 'Η υπηρεσία ανάλυσης αγρού του Phyt είναι προσωρινά μη διαθέσιμη'
          : 'Η υπηρεσία προτάσεων του Phyt είναι προσωρινά μη διαθέσιμη';
      return { error: `${msg}. Η εφαρμογή προσπάθησε αυτόματα αρκετές φορές χωρίς επιτυχία. Παρακαλώ δοκιμάστε ξανά αργότερα.` };
  }

  // Handle invalid API Key errors from the API
  if (errorMessageLower.includes('api key not valid') || errorMessageLower.includes('permission denied') || errorMessageLower.includes('authentication failed') || errorMessageLower.includes('invalid api key')) {
      const msg = context === 'advice' 
          ? 'Απέτυχε η λήψη απάντησης' 
          : context === 'examination' 
          ? 'Απέτυχε η εξέταση του προϊόντος'
          : context === 'order_extraction'
          ? 'Απέτυχε η ανάλυση της παραγγελίας'
          : context === 'order_extraction_audio'
          ? 'Απέτυχε η ανάλυση της ηχογράφησης'
          : context === 'crop_planning'
          ? 'Απέτυχε η ανάλυση του αγρού'
          : 'Απέτυχε η λήψη προτάσεων';
      return { error: `${msg} από τον Phyt. Το κλειδί API της Google (GEMINI_API_KEY) δεν είναι έγκυρο, δεν έχει οριστεί σωστά στον server, ή δεν έχει τα απαραίτητα δικαιώματα. Ελέγξτε τις ρυθμίσεις του API key στις μεταβλητές περιβάλλοντος του server σας.` };
  }

  // Handle weather location not found error
  if (context === 'advice' && errorMessageLower.includes('location_not_found')) {
      return { error: "Η τοποθεσία που δώσατε για τον καιρό δεν βρέθηκε. Παρακαλώ ελέγξτε την και δοκιμάστε ξανά."};
  }
  
  // Handle safety/error finish reasons
  const finishReason = error?.finishReason || (error?.candidates && error.candidates[0]?.finishReason);
  if (finishReason === 'ERROR' || finishReason === 'SAFETY') {
       const msg = context === 'advice' 
           ? 'το αίτημά σας' 
           : context === 'examination' || context === 'order_extraction'
           ? 'την εικόνα σας'
           : context === 'order_extraction_audio'
           ? 'την ηχογράφησή σας'
           : context === 'crop_planning'
           ? 'τις συντεταγμένες σας'
           : 'τα επιλεγμένα προϊόντα σας';
       return { error: `Ο Phyt δεν μπόρεσε να επεξεργαστεί ${msg} λόγω περιορισμών ασφαλείας ή εσωτερικού σφάλματος. Προσπαθήστε να αλλάξετε την ερώτησή σας.` };
  }
  
  // Generic fallback
  const msg = context === 'advice' 
      ? 'Απέτυχε η λήψη απάντησης' 
      : context === 'examination'
      ? 'Απέτυχε η εξέταση του προϊόντος'
      : context === 'order_extraction'
      ? 'Απέτυχε η ανάλυση της παραγγελίας'
      : context === 'order_extraction_audio'
      ? 'Απέτυχε η ανάλυση της ηχογράφησης'
      : context === 'crop_planning'
      ? 'Απέτυχε η ανάλυση του αγρού'
      : 'Απέτυχε η λήψη προτάσεων';
  return { error: `${msg} από τον Phyt. Ελέγξτε τη σύνδεσή σας ή τις ρυθμίσεις των API keys στον server. Λεπτομέρειες: ${error?.message || "Άγνωστο σφάλμα."}` };
};

export async function getAgroGreekAnswer(input: AskAgroGreekInput): Promise<AskAgroGreekOutput | { error: string }> {
  return withRetries(
    async () => await askAgroGreek(input), 
    (err) => handleGenericAiError(err, 'advice')
  );
}

export async function getProductExamination(input: ExamineProductInput): Promise<ExamineProductOutput | { error: string }> {
  return withRetries(
    async () => await examineProduct(input), 
    (err) => handleGenericAiError(err, 'examination')
  );
}

export async function getAIRecommendations(input: ProductRecommendationInput): Promise<ProductRecommendationOutput | { error: string }> {
  return withRetries(
    async () => await getProductRecommendations(input), 
    (err) => handleGenericAiError(err, 'recommendation')
  );
}

export async function getOrderExtraction(input: ExtractOrderFromImageInput): Promise<ExtractOrderFromImageOutput | { error: string }> {
  return withRetries(
    async () => await extractOrderFromImage(input), 
    (err) => handleGenericAiError(err, 'order_extraction')
  );
}

export async function getOrderExtractionFromAudio(input: ExtractOrderFromAudioInput): Promise<ExtractOrderFromAudioOutput | { error: string }> {
  return withRetries(
    async () => await extractOrderFromAudio(input), 
    (err) => handleGenericAiError(err, 'order_extraction_audio')
  );
}

export async function getSmartCropPlanAction(input: SmartCropPlanInput): Promise<SmartCropPlanOutput | { error: string }> {
  return withRetries(
    async () => await getSmartCropPlan(input), 
    (err) => handleGenericAiError(err, 'crop_planning')
  );
}
