import getWelcomeMessage from "./welcome-message.js";
import chooseNextAction from "./choose-next-action.js";
import searchProducts from "./product-search.js";
import searchAnnouncements from "./announcement-search.js";
import searchOrders from "./order-search.js";

import { validateToolSchema } from "../utils/validateToolSchema.js";

// Merge all tool modules
const allTools = {
  ...getWelcomeMessage,
  ...chooseNextAction,
  ...searchAnnouncements,
  ...searchProducts,
  ...searchOrders
};

// Validate each tool definition
for (const [name, tool] of Object.entries(allTools)) {
  try {
    validateToolSchema(tool, name); // optional second arg for better error messages
  } catch (err) {
    console.error(`❌ Invalid tool definition: "${name}"`, err);
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Tool validation failed for "${name}"`);
    }
  }
}

export const toolFunctions = allTools;