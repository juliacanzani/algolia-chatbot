/** @type {import('../utils/validateToolSchema.js').ToolDefinition} */
import { createAlgoliaTool } from "../utils/createAlgoliaTool.js";

export default createAlgoliaTool({
  name: "searchAnnouncements",
  description: `Search recent announcements and company updates. Use this tool to help users find updates relevant to their query.
You may return between 1 and 6 results. Use 1 for focused queries like "show the latest update", and up to 6 for general searches.`,
  tags: ["search", "announcements", "updates", "public"],
  indexName: process.env.ALGOLIA_ANNOUNCEMENTS_INDEX_NAME,
  defaultQuery: "",
  allowEmptyQuery: false,
  fieldsForMessage: ["title", "date", "summary"],
  fieldsForOptions: {
    title: { label: "Title", type: "title" },
    date: { label: "Date", type: "date" },
    summary: { label: "Summary", type: "longtext" }
  },
  formatIntro: () =>
    "Here are some updates that may be relevant. Don’t repeat these directly — just reference them naturally."
});