import { Readable } from 'stream';
import { json } from './json';

const readAll = (content: Readable): Promise<string> =>
  new Promise((resolve, reject) => {
    let result = '';
    content.on('data', (chunk) => (result += chunk.toString()));
    content.on('error', (err) => reject(err));
    content.on('end', () => resolve(result));
  });

describe('json', () => {
  const records = [
    { id: 'test-1', name: 'Test 1', extra: { nested: true } },
    { id: 'test-2', name: 'Test 2', other: { deep: { nested: 'value' } } },
  ];

  it('can stringify records to a json array', async () => {
    const content = json.applyTransform({}, Readable.from(records), () => {});

    expect(await readAll(content)).toBe(
      '[\n{"id":"test-1","name":"Test 1","extra":{"nested":true}},\n' +
        '{"id":"test-2","name":"Test 2","other":{"deep":{"nested":"value"}}}\n]\n'
    );
  });

  it('can stringify with pretty option', async () => {
    const content = json.applyTransform({ pretty: true }, Readable.from(records), () => {});

    expect(await readAll(content)).toContain('{\n  "id": "test-1",\n  "name": "Test 1",');
  });

  it('can pick fields of records', async () => {
    const content = json.applyTransform({ fields: ['id', 'other.deep.nested'] }, Readable.from(records), () => {});

    expect(await readAll(content)).toBe('[\n{"id":"test-1"},\n{"id":"test-2","other":{"deep":{"nested":"value"}}}\n]\n');
  });
});
