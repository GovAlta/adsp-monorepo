import { readFileSync } from 'fs';
import { join } from 'path';
import { loadAdspMcpTools } from '../server';

export interface ServiceMatchingQuery {
  query: string;
  /** Every one of these services must be found for the query to pass. */
  expected: string[];
  source: string;
}

/** For one tool result list, the service each result is about, in rank order (undefined when it is about none). */
export type RankServices = (query: string) => Promise<(string | undefined)[]>;

export interface QueryEvaluation {
  query: string;
  /** 1-based rank of each expected service's first result, or null when it is not in the results. */
  ranks: Record<string, number | null>;
}

const SEARCH_LIMIT = 20;

export function loadServiceMatchingQueries(): ServiceMatchingQuery[] {
  return JSON.parse(readFileSync(join(__dirname, 'service-matching.json'), 'utf8')).queries;
}

/** `services/<id>.md` and `tutorials/<id>/…` document service `<id>`; other pages document no single service. */
export function serviceOfDocPath(path: string): string | undefined {
  const match = /^services\/([a-z-]+)\.md$/.exec(path) ?? /^tutorials\/([a-z-]+)\//.exec(path);
  return match?.[1] === 'services' ? undefined : match?.[1];
}

export function rankWithSearchAdspDocs(docsRoot: string): RankServices {
  const search = loadAdspMcpTools({ docsRoot }).toolsByName.get('search_adsp_docs');
  if (!search) {
    throw new Error('search_adsp_docs is not registered.');
  }

  return async (query) => {
    const result = await search.handler({ query, limit: SEARCH_LIMIT });
    const [content] = result.content as { type: string; text: string }[];
    // A text that is not a JSON array is the tool's "no results" message.
    const results: unknown = content.text.startsWith('[') ? JSON.parse(content.text) : [];
    return (results as { path: string }[]).map(({ path }) => serviceOfDocPath(path));
  };
}

export async function evaluateServiceMatching(
  queries: ServiceMatchingQuery[],
  rankServices: RankServices,
): Promise<QueryEvaluation[]> {
  const evaluations: QueryEvaluation[] = [];
  for (const { query, expected } of queries) {
    const services = await rankServices(query);
    const ranks = Object.fromEntries(
      expected.map((service) => {
        const index = services.indexOf(service);
        return [service, index < 0 ? null : index + 1];
      }),
    );
    evaluations.push({ query, ranks });
  }
  return evaluations;
}

export function passesWithin(evaluation: QueryEvaluation, k: number): boolean {
  return Object.values(evaluation.ranks).every((rank) => rank !== null && rank <= k);
}

export function formatServiceMatchingReport(evaluations: QueryEvaluation[]): string {
  const rows = evaluations.map(({ query, ranks }) => {
    const cells = Object.entries(ranks).map(([service, rank]) => `${service} ${rank ?? `>${SEARCH_LIMIT}`}`);
    return `| ${query} | ${cells.join(', ')} |`;
  });
  const summary = [1, 3, 5].map(
    (k) => `top ${k}: ${evaluations.filter((evaluation) => passesWithin(evaluation, k)).length}/${evaluations.length}`,
  );
  return [
    '| Query | Rank of each expected service |',
    '| :-- | :-- |',
    ...rows,
    '',
    `Queries with every expected service in the ${summary.join(', ')}`,
  ].join('\n');
}
