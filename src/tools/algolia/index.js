import { createAlgoliaTool } from "./createTool.js";

import searchProducts from "./config/searchProducts.js";
import searchOrders from "./config/searchOrders.js";
import searchAnnouncements from "./config/searchAnnouncements.js";

export default {
  ...createAlgoliaTool(searchProducts),
  ...createAlgoliaTool(searchOrders),
  ...createAlgoliaTool(searchAnnouncements)
};
