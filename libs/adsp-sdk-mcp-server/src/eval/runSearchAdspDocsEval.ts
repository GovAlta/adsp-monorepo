// Reports where search_adsp_docs ranks the expected services for each query in service-matching.json, over the
// repo's docs/. Run with `npx nx run adsp-sdk-mcp-server:eval-service-matching`. It reports and does not fail:
// the result is a baseline for comparing matchers, not a gate.
import { join } from 'path';
import {
  evaluateServiceMatching,
  formatServiceMatchingReport,
  loadServiceMatchingQueries,
  rankWithSearchAdspDocs,
} from './serviceMatching';

const DOCS_ROOT = join(__dirname, '..', '..', '..', '..', 'docs');

evaluateServiceMatching(loadServiceMatchingQueries(), rankWithSearchAdspDocs(DOCS_ROOT)).then((evaluations) =>
  console.log(formatServiceMatchingReport(evaluations)),
);
