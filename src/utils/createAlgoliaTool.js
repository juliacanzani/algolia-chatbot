import { executeAlgoliaSearch } from "./executeAlgoliaSearch.js";
import { formatToolResponse } from "./formatToolResponse.js";

/**
 * Creates a standard search tool definition using Algolia.
 *
 * @param {Object} config - Configuration for the tool.
 * @param {string} config.name - Tool name.
 * @param {string} config.description - Tool description.
 * @param {string} config.indexName - Algolia index to search.
 * @param {Object} config.fieldsForMessage - Fields to include in the message.
 * @param {Object} config.fieldsForOptions - Fields to display as selectable options.
 * @param {string} [config.defaultQuery=""] - Fallback query when user provides no input.
 * @param {boolean} [config.allowEmptyQuery=false] - Whether the tool allows no query at all.
 * @param {Function} [config.formatIntro] - Optional function to customize intro text.
 * @param {Object} [config.extraParameters] - Additional parameters for the tool.
 * @param {Function} [config.getIndexName] - Function to choose index dynamically (e.g. for replicas).
 * @param {Function} [config.getSearchParams] - Optional function to provide extra search parameters (merged with defaults).
 * @returns {Object} Tool definition object compatible with toolFunctions.
 */
export function createAlgoliaTool({
  name,
  description,
  indexName,
  defaultQuery = "",
  allowEmptyQuery = false,
  needsUser = false,
  fieldsForMessage = [],
  fieldsForOptions = {},
  formatIntro = (query) => `Results for "${query}":`,
  extraParameters = {},
  getIndexName = () => indexName,
  getSearchParams
}) {
  return {
    [name]: {
      needsUser,
      definition: {
        type: "function",
        function: {
          name,
          description,
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The query to search the index with."
              },
              hitsPerPage: {
                type: "integer",
                minimum: 1,
                maximum: 6,
                description: "Number of results to return (max 6)"
              },
              ...extraParameters
            },
            required: allowEmptyQuery ? [] : ["query"],
            additionalProperties: false
          }
        }
      },
      func: async (params, user) => {
        const resolvedIndex = getIndexName(params);
        const query = params.query || defaultQuery;

        const defaultSearchParams = {
          query,
          hitsPerPage: params.hitsPerPage ?? 6
        };

        const customParams = getSearchParams
          ? getSearchParams({ params, user }) || {}
          : {};

        const searchConfig = {
          ...defaultSearchParams,
          ...customParams
        };

        const { hits, error } = await executeAlgoliaSearch({
          indexName: resolvedIndex,
          debug: process.env.DEBUG_ALGOLIA === "true",
          ...searchConfig
        });

        if (error || hits.length === 0) {
          return `No results found for "${query}".`;
        }

        return formatToolResponse({
          hits,
          intro: formatIntro(query),
          fieldsForMessage,
          fieldsForOptions
        });
      }
    }
  };
}