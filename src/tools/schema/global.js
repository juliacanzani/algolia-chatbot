import { z } from "zod";

/**
 * Common visibility conditions used for UI/action rendering.
 */
export const visibilitySchema = z.object({
  requiresUser: z.boolean().optional(),
  fallbackFrom: z.array(z.string()).optional(),
  intentTags: z.array(z.string()).optional(),
  always: z.boolean().optional()
}).optional();

/**
 * Shared base schema for any tool metadata (Algolia or otherwise).
 */
export const baseToolSchema = z.object({
  id: z.string(),               // Unique internal ID
  name: z.string(),             // OpenAI tool name (usually same as id)
  description: z.string(),      // For OpenAI to understand purpose
  tags: z.array(z.string()).optional(),

  labelKey: z.string().optional(),   // For UI button localization
  promptKey: z.string().optional(),  // Optional preset prompt localization
  visibility: visibilitySchema,      // Controls action visibility

  needsUser: z.boolean().optional(),  // Access control
  extraParameters: z.record(z.any()).optional(), // For extending input schema

  formatIntro: z.function().args(z.any()).returns(z.string()).optional()
});