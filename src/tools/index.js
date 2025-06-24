import getWelcomeMessage from "./welcome-message.js";
import chooseNextAction from "./choose-next-action.js";
import algoliaTools from "./algolia/index.js";

// Merge all tool modules
const allTools = {
  ...algoliaTools,
  ...getWelcomeMessage,
  ...chooseNextAction
};


export const toolFunctions = allTools;