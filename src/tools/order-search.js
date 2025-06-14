import { executeAlgoliaSearch } from "../utils/executeAlgoliaSearch.js";
import { formatToolResponse } from "../utils/formatToolResponse.js";
import { authenticateUser } from "../auth.js";

export const toolFunctions = {
  searchOrders: {
    definition: {
      type: "function",
      function: {
        name: "searchOrders",
        description: "Find past orders by ID, date, or status. Results of queries are automatically filtered by the current user's ID, so any results recieved from queries are safe to share. If the user asks generally for orders, the tool can return up to five results with an empty query.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search term for the order (e.g., purchase date, delivery date, order number, order total)"
            }
          },
          required: ["query"]
        }
      }
    },
    func: async ({ query }) => {
      const user = await authenticateUser();

      const { hits, error } = await executeAlgoliaSearch({
        indexName: process.env.ALGOLIA_ORDERS_INDEX_NAME,
        query,
        facetFilters: [`customerId:${user.customerID}`],
        maxHits: 5,
        debug: process.env.DEBUG_ALGOLIA === "true"
      });

      if (error || hits.length === 0) {
        return "We couldn’t find any orders matching that search.";
      }

      return formatToolResponse({
        hits,
        intro: `Here are some of your recent orders that matched your search.`,
        fieldsForMessage: ["orderNumber", "date", "total"],
        fieldsForOptions: {
          orderNumber: { label: "Order ID", type: "id" },
          date: { label: "Order Date", type: "date" },
          total: { label: "Total", type: "currency" }
        }
      });
    }
  }
};