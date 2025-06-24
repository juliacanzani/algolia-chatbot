/**
 * @param {Object} options
 * @param {Array} options.hits - Algolia search results
 * @param {string} options.intro - A message the AI can say before listing results
 * @param {string[]} options.fieldsForMessage - Which fields to include in the AI-visible message
 * @param {Object} options.fieldsForOptions - Object mapping field names to { label, type } for frontend display
 * @returns {{ message: string, displayOptions: Array, optionSchema: Object }}
 */
export function formatToolResponse({ hits, intro, fieldsForMessage, fieldsForOptions }) {
  const forMessage = hits.map(hit => {
    const item = {};
    for (const key of fieldsForMessage) {
      item[key] = hit[key];
    }
    return item;
  });

  const displayOptions = hits
  .map(hit => {
    const entry = {};
    for (const key in fieldsForOptions) {
      if (hit[key] != null) {
        entry[key] = hit[key];
      }
    }
    return entry;
  })
  .filter(entry => Object.keys(entry).length > 0);

  return {
    message: `${intro}\n\n` + JSON.stringify(forMessage),
    displayOptions,
    optionSchema: fieldsForOptions
  };
}