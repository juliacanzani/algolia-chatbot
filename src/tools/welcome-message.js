import { availableActions } from "../actions/definitions.js";
import { resolveLocale } from "../utils/resolveLocale.js";
import { getString } from "../strings/index.js";

export default {
  getWelcomeMessage: {
    definition: {
      type: "function",
      function: {
        name: "getWelcomeMessage",
        description: "Returns a localized welcome message and helpful starting options."
      }
    },
    needsUser: true,
    func: async (_, user) => {
      const locale = resolveLocale(user?.locale || "en");

      const message = getString(locale, "system.welcome.message", { name: user.name });

      const displayOptions = availableActions.map(({ id, value, labelKey, type }) => ({
        id,
        value,
        type,
        label: getString(locale, labelKey)
      }));

      return {
        message,
        displayOptions,
        optionSchema: {
          label: { type: "title" },
          value: { type: "text" },
          id: { type: "id" }
        },
        uiHints: {
          hideInputWhileOptionsVisible: false
        }
      };
    }
  }
};
