export function serializeAlgoliaParams({
  query = "",
  filters,
  facetFilters,
  numericFilters,
  maxHits = 10,
  additionalParams = {}
}) {
  const queryParts = [`query=${encodeURIComponent(query)}`, `hitsPerPage=${maxHits}`];

  if (filters) {
    queryParts.push(`filters=${encodeURIComponent(filters)}`);
  }

  if (Array.isArray(facetFilters)) {
    for (const facet of facetFilters) {
      queryParts.push(`facetFilters=${encodeURIComponent(facet)}`);
    }
  }

  if (Array.isArray(numericFilters)) {
    for (const nf of numericFilters) {
      queryParts.push(`numericFilters=${encodeURIComponent(nf)}`);
    }
  }

  for (const [key, value] of Object.entries(additionalParams)) {
    queryParts.push(`${key}=${encodeURIComponent(value)}`);
  }

  return queryParts.join("&");
}