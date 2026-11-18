// Reports where search_adsp_docs and find_adsp_services rank the expected services for each query in
// service-matching.json. search_adsp_docs searches the repo's docs/; find_adsp_services ranks the bundled capability
// catalog. Run with `npx nx run adsp-sdk-mcp-server:eval-service-matching`. It reports and does not fail; the
// threshold find_adsp_services must meet is checked in serviceMatching.spec.ts.
import { join } from 'path';
import {
  evaluateServiceMatching,
  formatServiceMatchingReport,
  loadServiceMatchingQueries,
  RankServices,
  rankWithFindAdspServices,
  rankWithSearchAdspDocs,
} from './serviceMatching';

const DOCS_ROOT = join(__dirname, '..', '..', '..', '..', 'docs');

const RANKERS: [string, RankServices][] = [
  ['search_adsp_docs', rankWithSearchAdspDocs(DOCS_ROOT)],
  ['find_adsp_services', rankWithFindAdspServices()],
];

async function main() {
  const queries = loadServiceMatchingQueries();
  for (const [tool, rank] of RANKERS) {
    console.log(`## ${tool}\n\n${formatServiceMatchingReport(await evaluateServiceMatching(queries, rank))}\n`);
  }
}

main();
