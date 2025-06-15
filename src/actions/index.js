import { allActions } from "./definitions.js";

/**
 * Get the list of available actions for the current user/context
 * @param {Object} context – may include user, session info, etc.
 */
export function getAvailableActions(context = {}) {
  // Filter logic can go here if needed
  return allActions;
}
