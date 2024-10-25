import { stringify } from 'csv-stringify';
import { ExportFormatter } from './types';
import { JsonStringifyTransform } from './json';

const formats: Record<string, ExportFormatter> = {
  csv: {
    extension: 'csv',
    createTransform: () => stringify({ header: true }),
  },
  json: {
    extension: 'json',
    createTransform: () => new JsonStringifyTransform(),
  },
};
export function getFormatter(format: string): ExportFormatter {
  return formats[format];
}
