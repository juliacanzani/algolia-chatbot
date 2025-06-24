import { algoliaToolSchema } from "./schema.js";

export function validateAlgoliaTool(config, name = "UnnamedAlgoliaTool") {
  try {
    algoliaToolSchema.parse(config);
    return { valid: true };
  } catch (err) {
    console.error(`❌ Validation failed for ${name}`, err.errors);
    return { valid: false, errors: err.errors };
  }
}