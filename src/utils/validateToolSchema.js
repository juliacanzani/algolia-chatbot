import { z } from "zod";

const toolParameterSchema = z.object({
  type: z.literal("object"),
  properties: z.record(z.object({
    type: z.string(), // e.g., "string", "number"
    description: z.string().optional()
  })),
  required: z.array(z.string()).optional(),
  additionalProperties: z.boolean().optional()
});

const toolFunctionSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: toolParameterSchema.optional()
});

export const singleToolSchema = z.object({
  definition: z.object({
    type: z.literal("function"),
    function: toolFunctionSchema
  }),
  func: z.function(),
  needsUser: z.boolean().optional()
});

/**
 * Validate a single tool definition (e.g., default export from welcome-message.js)
 */
export function validateToolSchema(tool, name = "UnnamedTool") {
  try {
    singleToolSchema.parse(tool);
    return { valid: true };
  } catch (err) {
    console.error(`❌ Tool schema validation failed for "${name}":\n`, err.errors);
    return { valid: false, errors: err.errors };
  }
}