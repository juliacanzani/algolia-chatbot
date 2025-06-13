import { authenticateUser } from "../auth.js";
import { algoliasearch } from "algoliasearch";

const algoliaClient = algoliasearch(
  process.env.ALGOLIA_APPLICATION_ID,
  process.env.ALGOLIA_API_KEY
);

export async function queryAlgolia({ indexName, query, maxHits = 3 }) {
  if (!query || query.trim().length < 2) {
    return { hits: [], error: "Please enter a more specific search." };
  }

  try {
    await authenticateUser();

    const { results } = await algoliaClient.search({
      requests: [
        {
          indexName,
          query
        }
      ]
    });

    const hits = results?.[0]?.hits?.slice(0, maxHits) ?? [];
    return { hits };
  } catch (err) {
    console.error(`Algolia query error for index "${indexName}":`, err);
    return { hits: [], error: "Sorry, something went wrong while searching." };
  }
}