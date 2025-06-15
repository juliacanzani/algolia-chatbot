import getWelcomeMessage from "./welcome-message.js";
import searchProducts from './product-search.js';
import searchAnnouncements from './announcement-search.js';
import searchOrders from './order-search.js';

export const toolFunctions = {
  ...getWelcomeMessage,
  ...searchAnnouncements,
  ...searchProducts,
  ...searchOrders
};