import { algoliasearch } from "algoliasearch";
import { serializeAlgoliaParams } from "./serializeAlgoliaParams.js";

const algoliaClient = algoliasearch(
  process.env.ALGOLIA_APPLICATION_ID,
  process.env.ALGOLIA_API_KEY
);

export async function executeAlgoliaSearch({
  indexName,
  query = "",
  filters,
  facetFilters,
  numericFilters,
  hitsPerPage = 6,
  debug = false,
  additionalParams = {}
}) {
  const maxHits = Math.min(hitsPerPage, 6);

  const params = serializeAlgoliaParams({
    query,
    filters,
    facetFilters,
    numericFilters,
    maxHits,
    additionalParams
  });

  const searchRequest = {
    indexName,
    params
  };

  if (debug) {
    console.log("🔍 [executeAlgoliaSearch] Request:", searchRequest);
  }

  try {
    const { results } = await algoliaClient.search({
      requests: [searchRequest]
    });

    const hits = results?.[0]?.hits ?? [];

    if (debug) {
      console.log(`✅ ${hits.length} hit(s) returned`);
    }

    return { hits };
  } catch (err) {
    console.error(`❌ Algolia search failed for "${indexName}":`, err);
    return { hits: [], error: "Search error" };
  }
}