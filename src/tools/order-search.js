// /src/tools/order-search.js
import { queryAlgolia } from "../utils/queryAlgolia.js";
import { formatToolResponse } from "../utils/formatToolResponse.js";

export const toolFunctions = {
  searchOrders: {
    definition: {
      type: "function",
      function: {
        name: "searchOrders",
        description: "Search the user's past orders using a keyword.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "A search term related to an order (e.g., item name, order ID, or date)"
            }
          },
          required: ["query"]
        }
      }
    },
    func: async ({ query }) => {
      const { hits, error } = await queryAlgolia({
        indexName: process.env.ALGOLIA_ORDERS_INDEX_NAME,
        query
      });

      if (error || hits.length === 0) {
        return "No matching orders found.";
      }

      return formatToolResponse({
        hits,
        intro: "Here are a few orders that may match what you're looking for. Only offer the user orders if they can identify them by ID/order number. Just mention one if it seems relevant.",
        fieldsForMessage: ["id", "item", "date", "total"],
        fieldsForOptions: {
          item: { label: "Name", type: "title" },
          total: { label: "Total", type: "currency" },
          date: { label: "Purchase Date", type: "date" },
          id: { label: "Order Number", type: "id" }
        }
      });
    }
  }
};