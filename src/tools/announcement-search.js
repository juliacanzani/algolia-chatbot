import { queryAlgolia } from "../utils/queryAlgolia.js";
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
      const { hits, error } = await queryAlgolia({
        indexName: process.env.ALGOLIA_ANNOUNCEMENTS_INDEX_NAME,
        query
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
          summary: { label: "", type: "text" },
        }
      });
    }
  }
};