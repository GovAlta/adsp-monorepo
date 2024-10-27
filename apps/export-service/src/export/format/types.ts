import { Transform } from 'stream';

export interface ExportFormatter {
  extension: string;
  createTransform: () => Transform;
}
