import { join } from 'path';
import { ApiSpecsRepository } from '../api-specs/apiSpecsRepository';
import { LinkIndex } from './links';
import { createApiTools } from './registerApiTools';

const FIXTURE_ROOT = join(__dirname, '../fixtures/api-specs');

function stubLinks(serviceDocs: string[] = ['services/demo-service.md']): LinkIndex {
  return {
    relatedForDoc: () => ({}),
    relatedForSymbol: () => ({}),
    docsForService: (app) => (app === 'demo-service' ? serviceDocs : []),
    hasDoc: () => true,
    hasServiceApi: () => true,
  };
}

function setup(links: LinkIndex = stubLinks()) {
  const load = jest.fn(() => new ApiSpecsRepository(FIXTURE_ROOT));
  const tools = new Map(createApiTools(load, () => links).map((tool) => [tool.name, tool]));
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const result = await tools.get(name)!.handler(args);
    return { isError: result.isError, text: (result.content[0] as { text: string }).text };
  };
  return { load, call };
}

describe('API tools', () => {
  it('does not load the specs until a tool is called', async () => {
    const { load, call } = setup();
    expect(load).not.toHaveBeenCalled();

    await call('list_service_apis');

    expect(load).toHaveBeenCalled();
  });

  it('lists service APIs inside results', async () => {
    const { call } = setup();

    expect(JSON.parse((await call('list_service_apis')).text)).toEqual({
      results: [{ service: 'demo-service', urn: 'urn:ads:platform:demo-service', name: 'Demo service', operations: 3 }],
    });
  });

  it('search_service_endpoints returns matching endpoints', async () => {
    const { call } = setup();
    const { results } = JSON.parse((await call('search_service_endpoints', { query: 'send event' })).text);

    expect(results[0]).toMatchObject({ method: 'POST', path: '/demo/v1/events' });
  });

  it("adds the services' docs once at the top level of an endpoint search", async () => {
    const { call } = setup(stubLinks(['services/demo-service.md', 'tutorials/demo.md']));
    const body = JSON.parse((await call('search_service_endpoints', { query: 'demo' })).text);

    expect(body.results.length).toBeGreaterThan(1);
    expect(body.related).toEqual({ docs: ['services/demo-service.md', 'tutorials/demo.md'] });
    expect(body.results.every((result: object) => !('related' in result))).toBe(true);
  });

  it('suggests reading the top endpoint', async () => {
    const { call } = setup();
    const body = JSON.parse((await call('search_service_endpoints', { query: 'send event' })).text);

    expect(body.next.suggested_calls).toEqual([
      {
        tool: 'read_service_endpoint',
        arguments: { service: 'demo-service', method: 'POST', path: '/demo/v1/events' },
        why: "Read the top endpoint's parameters and schemas.",
      },
    ]);
  });

  it('leaves out related when the services have no docs', async () => {
    const { call } = setup(stubLinks([]));
    const body = JSON.parse((await call('search_service_endpoints', { query: 'send event' })).text);

    expect(body).not.toHaveProperty('related');
  });

  it('search_service_endpoints explains a query of only stop words and a query with no match', async () => {
    const { call } = setup();

    expect((await call('search_service_endpoints', { query: 'how do i' })).text).toContain('only common words');
    expect((await call('search_service_endpoints', { query: 'kubernetes' })).text).toBe(
      'No endpoints match "kubernetes". Try other keywords, or call list_service_apis.',
    );
  });

  it('search_service_endpoints rejects an unknown service and names the known ones', async () => {
    const { call } = setup();

    expect(await call('search_service_endpoints', { query: 'file', service: 'nope' })).toEqual({
      isError: true,
      text: 'No service API named "nope". Use an app name or URN from list_service_apis: demo-service.',
    });
  });

  it('read_service_endpoint returns the endpoint', async () => {
    const { call } = setup();
    const endpoint = JSON.parse(
      (
        await call('read_service_endpoint', {
          service: 'urn:ads:platform:demo-service',
          method: 'post',
          path: '/demo/v1/files',
        })
      ).text,
    );

    expect(endpoint).toMatchObject({ service: 'demo-service', method: 'POST', summary: 'Upload a file.' });
  });

  it('adds the service doc and suggests reading it from an endpoint', async () => {
    const { call } = setup();
    const endpoint = JSON.parse(
      (await call('read_service_endpoint', { service: 'demo-service', method: 'POST', path: '/demo/v1/files' })).text,
    );

    expect(endpoint.related).toEqual({ docs: ['services/demo-service.md'] });
    expect(endpoint.next.suggested_calls).toEqual([
      {
        tool: 'read_adsp_doc',
        arguments: { path: 'services/demo-service.md' },
        why: "Read this service's documentation.",
      },
    ]);
  });

  it('keeps the unknown-service and unknown-endpoint errors unchanged', async () => {
    const { call } = setup(stubLinks([]));

    expect(await call('read_service_endpoint', { service: 'nope', method: 'GET', path: '/x' })).toEqual({
      isError: true,
      text: 'No service API named "nope". Use an app name or URN from list_service_apis: demo-service.',
    });
    expect((await call('read_service_endpoint', { service: 'demo-service', method: 'GET', path: '/x' })).isError).toBe(
      true,
    );
  });

  it('read_service_endpoint lists the service endpoints when the path is wrong', async () => {
    const { call } = setup();

    expect(
      await call('read_service_endpoint', { service: 'demo-service', method: 'GET', path: '/demo/v1/nope' }),
    ).toEqual({
      isError: true,
      text: 'demo-service has no GET /demo/v1/nope. Its endpoints: GET /demo/v1/files, POST /demo/v1/files, POST /demo/v1/events.',
    });
  });
});
