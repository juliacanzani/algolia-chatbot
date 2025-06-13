import { executeAlgoliaSearch } from "../utils/executeAlgoliaSearch.js";
import { formatToolResponse } from "../utils/formatToolResponse.js";

export const toolFunctions = {
  searchAnnouncements: {
    definition: {
      type: "function",
      function: {
        name: "searchAnnouncements",
        description: "Search recent announcements and company updates.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The keyword or phrase to search recent announcements."
            }
          },
          required: ["query"],
          additionalProperties: false
        }
      }
    },
    func: async ({ query }) => {
      const { hits, error } = await executeAlgoliaSearch({
        indexName: process.env.ALGOLIA_ANNOUNCEMENTS_INDEX_NAME,
        query,
        maxHits: 5,
        debug: process.env.DEBUG_ALGOLIA === "true"
      });

      if (error || hits.length === 0) {
        return "No announcements matched your query.";
      }

      return formatToolResponse({
        hits,
        intro: "Here are some updates that may be relevant. Don't repeat these directly — just reference them naturally.",
        fieldsForMessage: ["title", "date", "summary"],
        fieldsForOptions: {
          title: { label: "Title", type: "title" },
          date: { label: "Date", type: "date" },
          summary: { label: "Summary", type: "longtext" }
        }
      });
    }
  }
};