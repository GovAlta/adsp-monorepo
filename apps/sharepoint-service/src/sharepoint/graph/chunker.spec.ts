import { Readable } from 'stream';
import { readChunks } from './chunker';

const collect = async (stream: Readable, chunkSize: number) => {
  const chunks: Buffer[] = [];
  for await (const chunk of readChunks(stream, chunkSize)) {
    chunks.push(Buffer.from(chunk));
  }
  return chunks;
};

describe('readChunks', () => {
  it('splits a stream into chunks of the requested size with a shorter last chunk', async () => {
    const chunks = await collect(Readable.from([Buffer.alloc(25, 1)]), 10);

    expect(chunks.map((c) => c.length)).toEqual([10, 10, 5]);
  });

  it('emits no short chunk when the stream ends on a chunk boundary', async () => {
    const chunks = await collect(Readable.from([Buffer.alloc(20, 1)]), 10);

    expect(chunks.map((c) => c.length)).toEqual([10, 10]);
  });

  it('joins small parts that arrive separately', async () => {
    const parts = Array.from({ length: 7 }, (_, i) => Buffer.alloc(3, i));
    const chunks = await collect(Readable.from(parts), 10);

    expect(chunks.map((c) => c.length)).toEqual([10, 10, 1]);
    expect(Buffer.concat(chunks)).toEqual(Buffer.concat(parts));
  });

  it('splits a part larger than several chunks', async () => {
    const chunks = await collect(Readable.from([Buffer.alloc(35, 2)]), 10);

    expect(chunks.map((c) => c.length)).toEqual([10, 10, 10, 5]);
  });

  it('emits nothing for an empty stream', async () => {
    const chunks = await collect(Readable.from([]), 10);

    expect(chunks).toEqual([]);
  });

  it('accepts string parts', async () => {
    const chunks = await collect(Readable.from(['abcdef', 'ghij'], { objectMode: true }), 4);

    expect(chunks.map((c) => c.toString())).toEqual(['abcd', 'efgh', 'ij']);
  });
});
