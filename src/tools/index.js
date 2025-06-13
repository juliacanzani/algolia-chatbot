import { toolFunctions as productSearchTools } from './product-search.js';
import { toolFunctions as announcementTools } from './announcement-search.js';
import { toolFunctions as orderSearchTools } from './order-search.js';

export const toolFunctions = {
  ...announcementTools,
  ...productSearchTools,
  ...orderSearchTools
};