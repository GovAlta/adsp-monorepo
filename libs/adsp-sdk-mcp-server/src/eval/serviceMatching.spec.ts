import { existsSync } from 'fs';
import { join } from 'path';
import { FIXTURE_DOCS_ROOT } from '../fixtures/toolContract';
import {
  evaluateServiceMatching,
  formatServiceMatchingReport,
  loadServiceMatchingQueries,
  passesWithin,
  rankWithSearchAdspDocs,
  serviceOfDocPath,
} from './serviceMatching';

const REPO_DOCS_ROOT = join(__dirname, '..', '..', '..', '..', 'docs');

describe('service matching evaluation set', () => {
  const queries = loadServiceMatchingQueries();

  it('has at least 25 queries', () => {
    expect(queries.length).toBeGreaterThanOrEqual(25);
  });

  it('includes the 2026-11-14 probes', () => {
    expect(queries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          query: 'applicants attach supporting documents to an application',
          expected: ['file-service'],
        }),
        expect.objectContaining({
          query: 'holiday business days deadline calculation',
          expected: ['calendar-service'],
        }),
        expect.objectContaining({ query: 'upload file', expected: ['file-service'] }),
      ]),
    );
  });

  it('expects only services that have a service guide', () => {
    const missing = queries
      .flatMap(({ expected }) => expected)
      .filter((service) => !existsSync(join(REPO_DOCS_ROOT, 'services', `${service}.md`)));

    expect(missing).toEqual([]);
  });

  it('has no duplicate queries', () => {
    const texts = queries.map(({ query }) => query);

    expect(new Set(texts).size).toBe(texts.length);
  });
});

describe('serviceOfDocPath', () => {
  it.each([
    ['services/file-service.md', 'file-service'],
    ['tutorials/file-service/introduction.md', 'file-service'],
    ['services/services.md', undefined],
    ['platform/platform-node-sdk.md', undefined],
  ])('%s documents %s', (path, service) => {
    expect(serviceOfDocPath(path)).toBe(service);
  });
});

describe('evaluateServiceMatching', () => {
  const rank = async () => [undefined, 'file-service', 'form-service'];

  it('reports the 1-based rank of each expected service, or null when it is missing', async () => {
    const [evaluation] = await evaluateServiceMatching(
      [{ query: 'q', expected: ['form-service', 'calendar-service'], source: 'test' }],
      rank,
    );

    expect(evaluation).toEqual({ query: 'q', ranks: { 'form-service': 3, 'calendar-service': null } });
  });

  it('passes a query only when every expected service is within k', async () => {
    const [one, both] = await evaluateServiceMatching(
      [
        { query: 'one', expected: ['file-service'], source: 'test' },
        { query: 'both', expected: ['file-service', 'form-service'], source: 'test' },
      ],
      rank,
    );

    expect(passesWithin(one, 2)).toBe(true);
    expect(passesWithin(both, 2)).toBe(false);
    expect(passesWithin(both, 3)).toBe(true);
  });

  it('formats a row per query and a top-k summary', async () => {
    const evaluations = await evaluateServiceMatching(
      [{ query: 'attach a file', expected: ['file-service', 'calendar-service'], source: 'test' }],
      rank,
    );

    const report = formatServiceMatchingReport(evaluations);

    expect(report).toContain('| attach a file | file-service 2, calendar-service >20 |');
    expect(report).toContain('top 1: 0/1, top 3: 0/1, top 5: 0/1');
  });
});

describe('rankWithSearchAdspDocs', () => {
  it('maps search_adsp_docs results to the services they document', async () => {
    const services = await rankWithSearchAdspDocs(FIXTURE_DOCS_ROOT)('event service');

    expect(services[0]).toBe('event-service');
  });

  it('returns no services when the search finds nothing', async () => {
    expect(await rankWithSearchAdspDocs(FIXTURE_DOCS_ROOT)('zzzunmatched')).toEqual([]);
  });
});
