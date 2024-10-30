import { Readable } from 'stream';

export interface ExportFormatter<T = Record<string, unknown>> {
  extension: string;
  applyTransform: (options: T, records: Readable, cb: (err?: unknown) => void) => Readable;
}
