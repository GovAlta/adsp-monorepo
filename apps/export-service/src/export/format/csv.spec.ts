import { Readable } from 'stream';
import { csv } from './csv';

const readAll = (content: Readable): Promise<string> => // clean-code-ignore: 2.9
  new Promise((resolve, reject) => {
    let result = '';
    content.on('data', (chunk) => (result += chunk.toString()));
    content.on('error', (err) => reject(err));
    content.on('end', () => resolve(result));
  });

describe('csv', () => { // clean-code-ignore: 2.16
  const records = [
    { id: 'test-1', name: 'Test 1', extra: { nested: true } },
    { id: 'test-2', name: 'Test 2', other: { deep: { nested: 'value' } } },
  ];

  it('can flatten records to csv columns', async () => {
    const content = csv.applyTransform(
      { columns: ['id', 'name', 'other.deep.nested'] },
      Readable.from(records),
      () => {} // clean-code-ignore: 2.11
    );

    expect(await readAll(content)).toBe('id,name,other.deep.nested\ntest-1,Test 1,\ntest-2,Test 2,value\n');
  });

  it('can stringify with column header names', async () => {
    const content = csv.applyTransform(
      {
        columns: [
          { key: 'id', header: 'ID' },
          { key: 'extra.nested', header: 'Nested value' },
        ],
      },
      Readable.from(records),
      () => {} // clean-code-ignore: 2.11
    );

    expect(await readAll(content)).toBe('ID,Nested value\ntest-1,1\ntest-2,\n');
  });
});
