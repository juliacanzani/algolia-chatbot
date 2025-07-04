/** @type {import('../utils/validateToolSchema.js').ToolDefinition} */
import { createAlgoliaTool } from "../utils/createAlgoliaTool.js";

export default createAlgoliaTool({
  name: "searchProducts",
  description: `Search for relevant products in the catalog by keyword. This tool queries the product index and returns a list of results with basic details. 
  You can request between 1 and 6 products. If the user asks for the *best*, *top*, or *highest-rated* item, return **only 1** result. Otherwise, default to showing **6** products to fit a 2-column grid layout. 
  Products can be sorted by rating, price (ascending or descending), or by default relevance — choose the most appropriate sort based on the user's intent.`,
  tags: ["search", "products", "ecommerce", "public"],
  indexName: process.env.ALGOLIA_PRODUCTS_INDEX_NAME,
  defaultQuery: "",
  allowEmptyQuery: false,
  fieldsForMessage: ["name", "description", "price", "rating", "bullets"],
  fieldsForOptions: {
    name: { label: "Name", type: "title" },
    price: { label: "Price", type: "currency" },
    rating: { label: "Rating", type: "rating" },
    objectID: { label: "SKU", type: "id" }
  },
  extraParameters: {
    sort: {
      type: "string",
      description: "Optional sort mode. One of: 'rating_desc', 'price_asc', 'price_desc'"
    }
  },
  getIndexName: ({ sort }) => {
    switch (sort) {
      case "rating_desc":
        return "products_rating_desc";
      case "price_asc":
        return "products_price_asc";
      case "price_desc":
        return "products_price_desc";
      default:
        return process.env.ALGOLIA_PRODUCTS_INDEX_NAME;
    }
  },
  formatIntro: (query) => `Here are some products matching "${query}".`
});