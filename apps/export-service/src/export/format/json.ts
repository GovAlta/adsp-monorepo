import { pipeline, Transform, TransformCallback, TransformOptions } from 'stream';
import { ExportFormatter } from './types';

class JsonStringifyTransform extends Transform {
  private firstChunk = true;
  constructor(private pretty?: boolean, options?: TransformOptions) {
    super({ ...options, writableObjectMode: true });

    this.on('pipe', () => {
      // Add opening bracket for array.
      this.push('[\n');
    });
  }

  override _transform(chunk: unknown, _encoding: BufferEncoding, callback: TransformCallback): void {
    if (this.firstChunk) {
      this.push(`${JSON.stringify(chunk, null, this.pretty ? 2 : undefined)}`);
      this.firstChunk = false;
    } else {
      this.push(`,\n${JSON.stringify(chunk, null, this.pretty ? 2 : undefined)}`);
    }
    callback();
  }

  override _flush(callback: TransformCallback): void {
    // Add closing bracket for array.
    this.push('\n]\n');
    callback();
  }
}

interface JsonFormatterOptions {
  pretty?: boolean;
}

export const json: ExportFormatter<JsonFormatterOptions> = {
  extension: 'json',
  applyTransform: (options, records, callback) =>
    pipeline(records, new JsonStringifyTransform(options.pretty), callback),
};
