import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { join } from 'path';
import { loadServiceMatchingQueries } from './eval/serviceMatching';
import { connectInMemoryClient, FIXTURE_DOCS_ROOT, ToolCall } from './fixtures/toolContract';
import { createAdspMcpServer, CreateAdspMcpServerOptions, loadAdspMcpTools } from './server';
import { SuggestedCall } from './tools/envelope';
import { Related } from './tools/links';

interface Envelope {
  results?: { related?: Related }[];
  related?: Related;
  next?: { suggested_calls: SuggestedCall[] };
}

interface Step {
  call: ToolCall;
  depth: number;
  result: CallToolResult;
  envelope?: Envelope;
}

const FOLLOW_DEPTH = 2;

const callKey = ({ name, arguments: args }: ToolCall) => `${name} ${JSON.stringify(args, Object.keys(args).sort())}`;

function texts(result: CallToolResult): string[] {
  return result.content.flatMap((block) => (block.type === 'text' ? [block.text] : []));
}

// Plain-text answers (no match, only common words) carry no envelope.
function envelopeOf(result: CallToolResult): Envelope | undefined {
  if (result.structuredContent) {
    return result.structuredContent as Envelope;
  }
  const json = texts(result).find((text) => text.startsWith('{'));
  return json === undefined ? undefined : JSON.parse(json);
}

async function call(client: Client, toolCall: ToolCall): Promise<CallToolResult> {
  return (await client.callTool(toolCall)) as CallToolResult;
}

const suggestionsOf = ({ envelope }: Step): SuggestedCall[] => envelope?.next?.suggested_calls ?? [];

async function walk(client: Client, starts: ToolCall[]): Promise<Step[]> {
  const steps = new Map<string, Step>();
  let level = starts;
  for (let depth = 0; depth <= FOLLOW_DEPTH && level.length > 0; depth++) {
    const followed: Step[] = [];
    for (const toolCall of level) {
      if (steps.has(callKey(toolCall))) {
        continue;
      }
      const result = await call(client, toolCall);
      const step = { call: toolCall, depth, result, envelope: envelopeOf(result) };
      steps.set(callKey(toolCall), step);
      followed.push(step);
    }
    level = followed.flatMap(suggestionsOf).map(({ tool, arguments: args }) => ({ name: tool, arguments: args }));
  }
  return [...steps.values()];
}

function relatedOf({ envelope }: Step): Related[] {
  return [envelope?.related, ...(envelope?.results ?? []).map(({ related }) => related)].filter(
    (related): related is Related => !!related,
  );
}

const collect = (related: Related[], kind: keyof Related): string[] => [
  ...new Set(related.flatMap((entry) => entry[kind] ?? [])),
];

interface ContentSet {
  label: string;
  options: CreateAdspMcpServerOptions;
  starts: ToolCall[];
  // Free-text starts that may have nothing to suggest, but whatever they suggest must succeed.
  probes?: ToolCall[];
  reaches: string[];
}

const CHAINED_TOOLS = [
  'search_adsp_docs',
  'list_adsp_docs',
  'read_adsp_doc',
  'search_sdk_reference',
  'search_service_endpoints',
  'read_service_endpoint',
  'find_adsp_services',
];

const NEEDS = loadServiceMatchingQueries().map(({ query }) => query);
const SHORT_QUERIES = [
  'pdf',
  'calendar',
  'comment',
  'task queue',
  'configuration',
  'how do tenants log in',
  'live updates',
];

const CONTENT_SETS: ContentSet[] = [
  {
    label: 'the fixtures',
    options: { docsRoot: FIXTURE_DOCS_ROOT, apiSpecsRoot: join(__dirname, 'fixtures', 'api-specs') },
    starts: [
      { name: 'search_adsp_docs', arguments: { query: 'demo service' } },
      { name: 'list_adsp_docs', arguments: { prefix: 'services/' } },
      { name: 'read_adsp_doc', arguments: { path: 'services/demo-service.md' } },
      { name: 'search_sdk_reference', arguments: { query: 'initializeService' } },
      { name: 'search_service_endpoints', arguments: { query: 'upload a file' } },
      { name: 'find_adsp_services', arguments: { need: 'send a domain event' } },
    ],
    reaches: CHAINED_TOOLS,
  },
  {
    label: 'the bundled content',
    options: { docsRoot: join(__dirname, '..', '..', '..', 'docs'), apiSpecsRoot: join(__dirname, '..', 'api-specs') },
    starts: [
      { name: 'search_adsp_docs', arguments: { query: 'send a domain event' } },
      { name: 'list_adsp_docs', arguments: { prefix: 'services/event' } },
      { name: 'read_adsp_doc', arguments: { path: 'services/event-service.md' } },
      { name: 'search_sdk_reference', arguments: { query: 'initializeService' } },
      { name: 'search_service_endpoints', arguments: { query: 'upload a file' } },
      { name: 'find_adsp_services', arguments: { need: 'applicants attach supporting documents to an application' } },
    ],
    probes: [
      ...NEEDS.map((need) => ({ name: 'find_adsp_services', arguments: { need } })),
      ...[...NEEDS, ...SHORT_QUERIES].map((query) => ({ name: 'search_adsp_docs', arguments: { query } })),
    ],
    reaches: CHAINED_TOOLS,
  },
];

describe.each(CONTENT_SETS)('suggested calls and related references over $label', (contentSet) => {
  const { options, starts, probes = [], reaches } = contentSet;
  let client: Client;
  let steps: Step[];

  beforeAll(async () => {
    client = await connectInMemoryClient(createAdspMcpServer(options));
    steps = await walk(client, [...starts, ...probes]);
  });

  afterAll(async () => {
    await client.close();
  });

  it('every suggested call succeeds against the same server', () => {
    const startKeys = new Set(starts.map(callKey));
    const startsWithoutNext = steps.filter(
      (step) => startKeys.has(callKey(step.call)) && suggestionsOf(step).length === 0,
    );
    const failed = steps
      .filter(
        ({ depth, result, envelope }) => depth > 0 && (result.isError || !envelope || envelope.results?.length === 0),
      )
      .map(({ call, result }) => `${callKey(call)} -> ${texts(result)[0]}`);

    expect(startsWithoutNext.map(({ call }) => callKey(call))).toEqual([]);
    expect(steps.filter(({ depth }) => depth === FOLLOW_DEPTH).length).toBeGreaterThan(0);
    expect(failed).toEqual([]);
  });

  it('reaches every chained offline tool', () => {
    const endpointReads = steps.filter(({ call }) => call.name === 'read_service_endpoint');

    expect(reaches.filter((tool) => !steps.some(({ call }) => call.name === tool))).toEqual([]);
    expect(endpointReads.length).toBeGreaterThan(0);
    expect(
      endpointReads.filter(({ envelope }) => !envelope?.related?.docs?.length).map(({ call }) => callKey(call)),
    ).toEqual([]);
  });

  it('every related entry resolves', async () => {
    const related = steps.flatMap(relatedOf);
    const docs = collect(related, 'docs');
    const sdkSymbols = collect(related, 'sdkSymbols');
    const serviceApis = collect(related, 'serviceApis');
    const unresolved: string[] = [];

    for (const path of docs) {
      const result = await call(client, { name: 'read_adsp_doc', arguments: { path } });
      if (result.isError) {
        unresolved.push(`doc ${path}: ${texts(result)[0]}`);
      }
    }
    for (const name of sdkSymbols) {
      const result = await call(client, { name: 'search_sdk_reference', arguments: { query: name } });
      const first = (envelopeOf(result)?.results?.[0] as { name?: string } | undefined)?.name;
      if (first !== name) {
        unresolved.push(`sdkSymbol ${name}: first result ${first}`);
      }
    }
    for (const service of serviceApis) {
      const result = await call(client, { name: 'search_service_endpoints', arguments: { service, query: 'a' } });
      if (result.isError) {
        unresolved.push(`serviceApi ${service}: ${texts(result)[0]}`);
      }
    }

    expect({ docs: docs.length > 0, sdkSymbols: sdkSymbols.length > 0, serviceApis: serviceApis.length > 0 }).toEqual({
      docs: true,
      sdkSymbols: true,
      serviceApis: true,
    });
    expect(unresolved).toEqual([]);
  });

  it('no suggestion names a tool missing from the offline /mcp endpoint', () => {
    const { offlineToolsByName } = loadAdspMcpTools(options);
    const suggested = steps.flatMap(suggestionsOf).map(({ tool }) => tool);

    expect(suggested.length).toBeGreaterThan(0);
    expect([...new Set(suggested)].filter((tool) => !offlineToolsByName.has(tool))).toEqual([]);
  });
});

it('builds the link index lazily', async () => {
  const client = await connectInMemoryClient(
    createAdspMcpServer({ docsRoot: FIXTURE_DOCS_ROOT, apiSpecsRoot: join(__dirname, 'no-such-api-specs') }),
  );
  const result = await call(client, { name: 'read_adsp_doc', arguments: { path: 'services/event-service.md' } });
  await client.close();

  expect(result.isError).toBeFalsy();
  expect(texts(result)[0]).toContain('# Event service');
});
