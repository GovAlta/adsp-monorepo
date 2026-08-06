const REGEX_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

function toCaseInsensitiveContains(value: string): Record<string, string> {
  return { $regex: value.replace(REGEX_SPECIAL_CHARACTERS, '\\$&'), $options: 'i' };
}

// Data criteria come from user entered filter values, so text is matched as a case insensitive substring;
// the user filtering forms or submissions knows neither the casing nor the full value in the stored data.
// Non-text values (e.g. the number and integer filters) remain exact matches.
export function toDataCriteriaQuery(dataCriteria: Record<string, unknown>, path: string): Record<string, unknown> {
  return Object.entries(dataCriteria).reduce(
    (query, [property, value]) => {
      query[`${path}.${property}`] = typeof value === 'string' ? toCaseInsensitiveContains(value) : value;
      return query;
    },
    {} as Record<string, unknown>,
  );
}
