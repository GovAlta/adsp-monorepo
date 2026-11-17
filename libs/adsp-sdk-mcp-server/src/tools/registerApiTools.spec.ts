import { join } from 'path';
import { ApiSpecsRepository } from '../api-specs/apiSpecsRepository';
import { createApiTools } from './registerApiTools';

const FIXTURE_ROOT = join(__dirname, '../fixtures/api-specs');

function setup() {
  const load = jest.fn(() => new ApiSpecsRepository(FIXTURE_ROOT));
  const tools = new Map(createApiTools(load).map((tool) => [tool.name, tool]));
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

  it('list_service_apis lists each service with its URN and operation count', async () => {
    const { call } = setup();

    expect(JSON.parse((await call('list_service_apis')).text)).toEqual([
      { service: 'demo-service', urn: 'urn:ads:platform:demo-service', name: 'Demo service', operations: 3 },
    ]);
  });

  it('search_service_endpoints returns matching endpoints', async () => {
    const { call } = setup();
    const results = JSON.parse((await call('search_service_endpoints', { query: 'send event' })).text);

    expect(results[0]).toMatchObject({ method: 'POST', path: '/demo/v1/events' });
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
