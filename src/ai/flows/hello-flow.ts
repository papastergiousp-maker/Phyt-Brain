
'use server';

import { z } from 'zod';
import { getGlobalAi } from '@/ai/genkit';

const ai = getGlobalAi();

export const helloFlow = ai.defineFlow(
  {
    name: 'helloFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (name) => {
    const { output } = await ai.generate({
      model: 'gemini-pro',
      prompt: `Hello Gemini, my name is ${name}`,
    });
    return output!;
  }
);
