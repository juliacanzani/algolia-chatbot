import { toolFunctions } from "./index.js";
import { getString } from "../strings/index.js";

export default {
  chooseNextAction: {
    definition: {
      type: "function",
      function: {
        name: "chooseNextAction",
        description: "Handles a user’s selected next step, like viewing orders or browsing products.",
        parameters: {
          type: "object",
          properties: {
            action: {
              type: "string",
              description: "The selected action (e.g. 'searchOrders', 'searchProducts')"
            }
          },
          required: ["action"]
        }
      }
    },
    needsUser: true,
    func: async ({ action }, user) => {
      const locale = user?.locale || "en";

      switch (action) {
        case "searchOrders":
          return await toolFunctions.searchOrders.func({ query: "" }, user);

        case "searchProducts":
          return await toolFunctions.searchProducts.func({ query: "" });

        case "searchAnnouncements":
          return await toolFunctions.searchAnnouncements.func({ query: "" });

        default:
          return {
            message: getString(locale, "system.unknownAction", { action })
          };
      }
    }
  }
};
