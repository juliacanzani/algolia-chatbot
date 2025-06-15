import { toolFunctions as welcomeTools } from "./welcome-message.js";
import { toolFunctions as productSearchTools } from './product-search.js';
import { toolFunctions as announcementTools } from './announcement-search.js';
import { toolFunctions as orderSearchTools } from './order-search.js';

export const toolFunctions = {
  ...welcomeTools,
  ...announcementTools,
  ...productSearchTools,
  ...orderSearchTools
};