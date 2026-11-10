import { Readable } from 'stream';

export async function* readChunks(stream: Readable, chunkSize: number): AsyncGenerator<Buffer> {
  let pending: Buffer[] = [];
  let pendingLength = 0;

  for await (const part of stream) {
    const buffer = Buffer.isBuffer(part) ? part : Buffer.from(part);
    pending.push(buffer);
    pendingLength += buffer.length;

    if (pendingLength >= chunkSize) {
      const joined = Buffer.concat(pending, pendingLength);
      let offset = 0;
      while (joined.length - offset >= chunkSize) {
        yield joined.subarray(offset, offset + chunkSize);
        offset += chunkSize;
      }
      const rest = joined.subarray(offset);
      pending = rest.length > 0 ? [rest] : [];
      pendingLength = rest.length;
    }
  }

  if (pendingLength > 0) {
    yield Buffer.concat(pending, pendingLength);
  }
}
