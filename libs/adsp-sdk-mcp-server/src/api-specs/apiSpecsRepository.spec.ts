import { join } from 'path';
import { ApiSpecsRepository } from './apiSpecsRepository';

const FIXTURE_ROOT = join(__dirname, '../fixtures/api-specs');
const BUNDLED_ROOT = join(__dirname, '../../api-specs');

describe('ApiSpecsRepository', () => {
  const repo = new ApiSpecsRepository(FIXTURE_ROOT);
  const demo = repo.findService('demo-service');

  it('lists services from the index', () => {
    expect(repo.list().map(({ app }) => app)).toEqual(['demo-service']);
  });

  it.each(['demo-service', 'urn:ads:platform:demo-service', 'Demo Service'])('finds a service by %s', (name) => {
    expect(repo.findService(name)?.app).toBe('demo-service');
  });

  it('ranks the endpoint whose summary and path match first, using search aliases', () => {
    const [first] = repo.search('upload');

    expect(first).toEqual({
      service: 'demo-service',
      method: 'POST',
      path: '/demo/v1/files',
      summary: 'Upload a file.',
      deprecated: false,
      access: ['Requires the demo-admin role, held in the tenant or as a Core role.'],
    });
  });

  it('limits search to one service and to the requested count', () => {
    expect(repo.search('file', { service: demo, limit: 1 })).toHaveLength(1);
  });

  it('reads an endpoint with path parameters merged and schema references inlined', () => {
    const endpoint = repo.read(demo!, 'post', '/demo/v1/files');

    expect(endpoint?.parameters).toEqual([{ name: 'tenantId', in: 'query', schema: { type: 'string' } }]);
    expect(endpoint?.requestBody).toEqual({
      content: {
        'multipart/form-data': {
          schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
        },
      },
    });
  });

  it('stops inlining a schema that refers to itself', () => {
    const endpoint = repo.read(demo!, 'POST', '/demo/v1/files');
    const schema = (endpoint?.responses['200'] as { content: Record<string, { schema: unknown }> }).content[
      'application/json'
    ].schema;

    expect(schema).toEqual({
      type: 'object',
      properties: { name: { type: 'string' }, child: { $ref: '#/components/schemas/Node' } },
    });
  });

  it('reports deprecation and anonymous access', () => {
    expect(repo.read(demo!, 'GET', '/demo/v1/files')).toMatchObject({
      deprecated: true,
      access: ['Anonymous access is allowed; no role is required.'],
    });
  });

  it('returns undefined for an endpoint the service does not have', () => {
    expect(repo.read(demo!, 'DELETE', '/demo/v1/files')).toBeUndefined();
  });
});

describe('ApiSpecsRepository over the bundled specs', () => {
  const repo = new ApiSpecsRepository(BUNDLED_ROOT);

  it('finds the file upload endpoint for "upload a file"', () => {
    expect(repo.search('upload a file', { limit: 1 })).toEqual([
      expect.objectContaining({ service: 'file-service', method: 'POST', path: '/file/v1/files' }),
    ]);
  });

  it('reads every bundled endpoint', () => {
    for (const service of repo.list()) {
      for (const entry of repo.paths(service)) {
        const [method, path] = entry.split(' ');
        expect(repo.read(service, method, path)).toBeDefined();
      }
    }
  });
});
