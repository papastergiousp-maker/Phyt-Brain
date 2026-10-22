
'use server';

import type { RegisteredUser } from '@/lib/types';

interface GrantLicensesParams {
  agronomistId: string;
  licenseCount: number;
}

/**
 * A server action to grant licenses to an agronomist.
 * This function currently serves as a placeholder for a real database operation.
 * It returns a success message to be used by the client-side state management.
 * In a real application, this would update a user record in a database (e.g., Firestore).
 */
export async function grantLicensesToAction(params: GrantLicensesParams): Promise<{ success: boolean; message?: string; error?: string }> {
  const { agronomistId, licenseCount } = params;

  if (!agronomistId) {
    return { success: false, error: 'Agronomist ID is required.' };
  }
  if (licenseCount < 0) {
    return { success: false, error: 'License count cannot be negative.' };
  }
  
  // --- SIMULATION of a database update ---
  // In a real application, you would find the agronomist by their ID in your database
  // and update their 'proLicenseCount' field.
  // For this demo, we assume the operation is successful and the client-side
  // Zustand store will handle the state update.
  console.log(`[Admin Action] Simulating granting ${licenseCount} licenses to agronomist ${agronomistId}`);
  // --- END SIMULATION ---
  
  return { success: true, message: `Successfully set license count to ${licenseCount} for the selected agronomist.` };
}
