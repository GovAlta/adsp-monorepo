import { Transform, TransformCallback, TransformOptions } from 'stream';

export class JsonStringifyTransform extends Transform {
  private firstChunk = true;
  constructor(options?: TransformOptions) {
    super({ ...options, writableObjectMode: true });

    this.on('pipe', () => {
      // Add opening bracket for array.
      this.push('[\n');
    });
  }

  override _transform(chunk: unknown, _encoding: BufferEncoding, callback: TransformCallback): void {
    if (this.firstChunk) {
      this.push(`  ${JSON.stringify(chunk)}`);
      this.firstChunk = false;
    } else {
      this.push(`,\n  ${JSON.stringify(chunk)}`);
    }
    callback();
  }

  override _flush(callback: TransformCallback): void {
    // Add closing bracket for array.
    this.push('\n]\n');
    callback();
  }
}
