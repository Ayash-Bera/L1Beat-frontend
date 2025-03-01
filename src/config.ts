import { z } from 'zod';

// Define a schema for environment variables
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().optional(),
});

// Parse environment variables
const env = envSchema.parse(import.meta.env);

// Configuration with fallbacks
export const config = {
  apiBaseUrl: env.VITE_API_BASE_URL || 'https://backend-phi-green.vercel.app',
} as const;