import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ApiServiceSummary } from '../api-specs/apiSpecsRepository';
import { DocsRepository } from '../docs/docsRepository';
import { SdkSymbolDoc } from '../sdk-reference/reference';
import { buildLinkIndex, LinkIndex, RELATED_CAP } from './links';

const DEMO_PAGE = `---
title: Demo service
---
# Demo service

See [events](event-service.md), [again](../services/event-service.md#details) and
[directory](/adsp-monorepo/services/directory-service.html#top).

Not pages: [missing](services/missing.md), [outside](https://example.com/x.md), [top](#top),
[mail](mailto:someone@example.com).

Call initializeService, then ServiceRegistration; platform code uses initializePlatform with an AdspId.
The caller is authorized by a Token.
`;

function symbol(name: string, seeAlso?: string[]): SdkSymbolDoc {
  return { name, kind: 'function', module: 'test', summary: name, seeAlso };
}

function apiService(app: string): ApiServiceSummary {
  return { app, urn: `urn:ads:platform:${app}`, name: app, operations: 1, file: `${app}.json` };
}

describe('buildLinkIndex', () => {
  let docsRoot: string;
  let docs: DocsRepository;
  const sdkSymbols = [
    symbol('authorize'),
    symbol('initializeService', ['initializeService', 'Unknown', 'ServiceRegistration']),
    symbol('ServiceRegistration'),
    symbol('initializePlatform'),
    symbol('AdspId'),
    symbol('Token'),
  ];

  beforeAll(() => {
    docsRoot = mkdtempSync(join(tmpdir(), 'links-'));
    mkdirSync(join(docsRoot, 'services'));
    writeFileSync(join(docsRoot, 'services', 'demo-service.md'), DEMO_PAGE);
    for (const name of ['event-service', 'directory-service', 'tenant-service']) {
      writeFileSync(join(docsRoot, 'services', `${name}.md`), `# ${name}\n`);
    }
    docs = new DocsRepository(docsRoot);
  });

  afterAll(() => rmSync(docsRoot, { recursive: true, force: true }));

  let apiServices: jest.Mock<ApiServiceSummary[], []>;
  let links: LinkIndex;

  beforeEach(() => {
    apiServices = jest.fn(() => [apiService('demo-service'), apiService('tenant-management-api')]);
    links = buildLinkIndex({ docs, sdkSymbols, apiServices });
  });

  it('relates a page to the bundled pages it links, in order, without duplicates', () => {
    expect(links.relatedForDoc('services/demo-service.md').docs).toEqual([
      'services/event-service.md',
      'services/directory-service.md',
    ]);
  });

  it('drops links that do not resolve to a bundled page', () => {
    const { docs: related } = links.relatedForDoc('services/demo-service.md');

    expect(related).not.toContain('services/services/missing.md');
    expect(related?.join()).not.toMatch(/missing\.md|example\.com|#top|mailto/);
  });

  it('relates a page to the SDK symbols it names as whole words, capped at 3', () => {
    const { sdkSymbols: related } = links.relatedForDoc('services/demo-service.md');

    expect(related).toHaveLength(RELATED_CAP);
    expect(related?.[0]).toBe('initializeService');
    expect(related).not.toContain('authorize');
  });

  it('ignores symbols of 5 characters or fewer', () => {
    const { sdkSymbols: related } = buildLinkIndex({
      docs,
      sdkSymbols: [symbol('Token'), symbol('initializeService')],
      apiServices,
    }).relatedForDoc('services/demo-service.md');

    expect(related).toEqual(['initializeService']);
  });

  it('relates a service page to its API', () => {
    expect(links.relatedForDoc('services/demo-service.md').serviceApis).toEqual(['demo-service']);
    expect(links.relatedForDoc('services/tenant-service.md').serviceApis).toEqual(['tenant-management-api']);
  });

  it('relates a symbol to its seeAlso and the pages naming it', () => {
    expect(links.relatedForSymbol('initializeService')).toEqual({
      sdkSymbols: ['ServiceRegistration'],
      docs: ['services/demo-service.md'],
    });
  });

  it('maps a service API back to its doc', () => {
    expect(links.docsForService('demo-service')).toEqual(['services/demo-service.md']);
  });

  it('answers whether a doc or service API is known', () => {
    expect(links.hasDoc('services/demo-service.md')).toBe(true);
    expect(links.hasDoc('services/nope.md')).toBe(false);
    expect(links.hasServiceApi('demo-service')).toBe(true);
    expect(links.hasServiceApi('nope')).toBe(false);
  });

  it('leaves out empty kinds', () => {
    expect(links.relatedForDoc('services/event-service.md')).toEqual({});
  });

  it('reads the API index once', () => {
    links.relatedForDoc('services/demo-service.md');
    links.docsForService('demo-service');
    links.hasServiceApi('demo-service');

    expect(apiServices).toHaveBeenCalledTimes(1);
  });

  it('builds nothing until first use', () => {
    expect(apiServices).not.toHaveBeenCalled();
  });
});

describe('buildLinkIndex with one-word symbol names', () => {
  const PAGES: Record<string, string> = {
    'guides/prose.md': '# Prose\n\nTenant users sign in to the Tenant admin.\n',
    'guides/span.md': '# Span\n\nTenant users call initializeService, then pass a `Tenant`.\n',
    'guides/fence.md': '# Fence\n\n```typescript\nconst tenant: Tenant = await getTenant();\n```\n',
  };
  let docsRoot: string;
  let links: LinkIndex;

  beforeAll(() => {
    docsRoot = mkdtempSync(join(tmpdir(), 'links-'));
    mkdirSync(join(docsRoot, 'guides'));
    for (const [path, content] of Object.entries(PAGES)) {
      writeFileSync(join(docsRoot, path), content);
    }
    links = buildLinkIndex({
      docs: new DocsRepository(docsRoot),
      sdkSymbols: [symbol('Tenant'), symbol('initializeService')],
      apiServices: () => [],
    });
  });

  afterAll(() => rmSync(docsRoot, { recursive: true, force: true }));

  it('does not match a one-word name in prose', () => {
    expect(links.relatedForDoc('guides/prose.md')).toEqual({});
  });

  it('matches a one-word name in a code span, ordered by where the code names it', () => {
    expect(links.relatedForDoc('guides/span.md').sdkSymbols).toEqual(['initializeService', 'Tenant']);
  });

  it('matches a one-word name in a fenced code block', () => {
    expect(links.relatedForDoc('guides/fence.md').sdkSymbols).toEqual(['Tenant']);
  });

  it('relates a one-word symbol only to the pages that name it in code', () => {
    expect([...(links.relatedForSymbol('Tenant').docs ?? [])].sort()).toEqual(['guides/fence.md', 'guides/span.md']);
  });
});
