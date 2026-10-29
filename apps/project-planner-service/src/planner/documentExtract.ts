import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

export const MAX_PROBLEM_STATEMENT_UPLOAD_BYTES = 20 * 1024 * 1024;

const PLAIN_TEXT_EXTENSIONS = new Set(['md', 'markdown']);
const DOCX_EXTENSIONS = new Set(['docx']);
const PDF_EXTENSIONS = new Set(['pdf']);

export const PROBLEM_STATEMENT_UPLOAD_ACCEPT = '.md,.markdown,.docx,.pdf';

const extensionOf = (filename: string): string => filename.toLowerCase().split('.').pop() || '';

export const isSupportedProblemStatementFile = (filename: string): boolean => {
  const ext = extensionOf(filename);
  return PLAIN_TEXT_EXTENSIONS.has(ext) || DOCX_EXTENSIONS.has(ext) || PDF_EXTENSIONS.has(ext);
};

export async function extractProblemStatementText(buffer: Buffer, filename: string): Promise<string> {
  const ext = extensionOf(filename);
  if (PLAIN_TEXT_EXTENSIONS.has(ext)) {
    return buffer.toString('utf8').trim();
  }
  if (DOCX_EXTENSIONS.has(ext)) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value.trim();
  }
  if (PDF_EXTENSIONS.has(ext)) {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const { text } = await parser.getText();
      return (text || '').trim();
    } finally {
      await parser.destroy();
    }
  }
  throw new Error(`Unsupported file format: .${ext || 'unknown'}.`);
}
