import { z } from "zod";
import { baseToolSchema } from "../schema/global.js";

export const algoliaToolSchema = baseToolSchema.extend({
  indexName: z.string(),
  fieldsForMessage: z.array(z.string()),
  fieldsForOptions: z.record(z.any()),
  getIndexName: z.function().optional(),
  getSearchParams: z.function().optional(),
  allowEmptyQuery: z.boolean().default(false)
});
