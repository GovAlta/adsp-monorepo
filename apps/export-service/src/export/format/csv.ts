import { stringify } from 'csv-stringify';
import { flatten, type FlattenOptions } from 'flat';
import { pipeline, Transform, TransformCallback, TransformOptions } from 'stream';
import { ExportFormatter } from './types';

class FlattenObjectTransform extends Transform {
  constructor(private flatten: (object: unknown, options: FlattenOptions) => object, options?: TransformOptions) {
    super({ ...options, objectMode: true });
  }

  override _transform(chunk: unknown, _encoding: BufferEncoding, callback: TransformCallback): void {
    this.push(this.flatten(chunk, { safe: true }));
    callback();
  }
}

interface CsvFormatterOptions {
  columns: string[];
}

export const csv: ExportFormatter<CsvFormatterOptions> = {
  extension: 'csv',
  applyTransform: (options, records, callback) =>
    pipeline(
      records,
      new FlattenObjectTransform(flatten),
      stringify({ header: true, columns: options.columns }),
      callback
    ),
};
