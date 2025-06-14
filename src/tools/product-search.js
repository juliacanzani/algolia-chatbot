import { executeAlgoliaSearch } from "../utils/executeAlgoliaSearch.js";
import { formatToolResponse } from "../utils/formatToolResponse.js";

export default {
  searchProducts: {
    definition: {
      type: "function",
      function: {
        name: "searchProducts",
        description: "Search for specific products in the product catalog.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The query string used to search through the product database"
            }
          },
          required: ["query"],
          additionalProperties: false
        }
      }
    },
    func: async ({ query }) => {
      const { hits, error } = await executeAlgoliaSearch({
        indexName: process.env.ALGOLIA_PRODUCTS_INDEX_NAME,
        query,
        maxHits: 5,
        debug: process.env.DEBUG_ALGOLIA === "true"
      });

      if (error || hits.length === 0) {
        return "No products matched your query.";
      }

      return formatToolResponse({
        hits,
        intro: "Here are some products that match your search. Below this message, the user will see each product's name, price, and customer rating. Don't repeat the list — just highlight a relevant item or two in plain language.",
        fieldsForMessage: ["name", "description", "price", "rating", "bullets"],
        fieldsForOptions: {
          name: { label: "Name", type: "title" },
          price: { label: "Price", type: "currency" },
          rating: { label: "Rating", type: "rating" },
          objectID: { label: "SKU", type: "id" }
        }
      });
    }
  }
};