import getWelcomeMessage from "./welcome-message.js";
import chooseNextAction from './choose-next-action.js';
import searchProducts from './product-search.js';
import searchAnnouncements from './announcement-search.js';
import searchOrders from './order-search.js';

export const toolFunctions = {
  ...getWelcomeMessage,
  ...chooseNextAction,
  ...searchAnnouncements,
  ...searchProducts,
  ...searchOrders
};