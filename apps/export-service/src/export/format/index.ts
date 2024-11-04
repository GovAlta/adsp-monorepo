import { csv } from './csv';
import { json } from './json';
import { ExportFormatter } from './types';

export function getFormatter(format: string): Promise<ExportFormatter> {
  const formats = {
    csv,
    json,
  };

  return formats[format];
}
