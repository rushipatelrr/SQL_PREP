import { z } from 'zod';

export const updateThemeSchema = z.object({
  theme: z.enum(['dark', 'light']),
});
