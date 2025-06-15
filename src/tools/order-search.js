import { executeAlgoliaSearch } from "../utils/executeAlgoliaSearch.js";
import { formatToolResponse } from "../utils/formatToolResponse.js";

export default {
  searchOrders: {
    needsUser: true, 
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
    func: async ({ query }, user) => {
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
        intro: `Below this message, the user will see each order's number, total price, and date. Don't repeat the list — just highlight a relevant item or two in plain language.`,
        fieldsForMessage: ["orderNumber", "date", "total"],
        fieldsForOptions: {
          orderNumber: { label: "Order #", type: "id" },
          date: { label: "Order Date", type: "date" },
          total: { label: "Total", type: "currency" }
        }
      });
    }
  }
};