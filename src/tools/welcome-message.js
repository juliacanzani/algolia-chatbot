import { getString } from "../strings/index.js";

export const toolFunctions = {
  getWelcomeMessage: {
    definition: {
      type: "function",
      function: {
        name: "getWelcomeMessage",
        description: "Returns a localized welcome message."
      }
    },
    needsUser: true,
    func: async (_, user) => {
      const locale = user?.locale || "en";

      const raw = getString(locale, "system.welcome.message");

      const message = getString(locale, "system.welcome.message", { name: user.name });

      return {
        message
      };
    }
  }
};