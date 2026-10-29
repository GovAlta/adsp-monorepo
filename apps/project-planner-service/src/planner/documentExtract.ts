import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

export const MAX_PROBLEM_STATEMENT_UPLOAD_BYTES = 20 * 1024 * 1024;

const PLAIN_TEXT_EXTENSIONS = new Set(['md', 'markdown']);
const DOCX_EXTENSIONS = new Set(['docx']);
const DOC_EXTENSIONS = new Set(['doc']);
const PDF_EXTENSIONS = new Set(['pdf']);

export const PROBLEM_STATEMENT_UPLOAD_ACCEPT = '.md,.markdown,.doc,.docx,.pdf';

const extensionOf = (filename: string): string => filename.toLowerCase().split('.').pop() || '';

export const isSupportedProblemStatementFile = (filename: string): boolean => {
  const ext = extensionOf(filename);
  return (
    PLAIN_TEXT_EXTENSIONS.has(ext) || DOCX_EXTENSIONS.has(ext) || DOC_EXTENSIONS.has(ext) || PDF_EXTENSIONS.has(ext)
  );
};

const HTML_SIGNATURE = /^\s*(<\?xml[^>]*>\s*)?(<!doctype\s+html|<html)/i;

const isHtmlExport = (buffer: Buffer): boolean => {
  const head = buffer
    .subarray(0, 1024)
    .toString('utf8')
    .replace(/^\uFEFF/, '');
  return HTML_SIGNATURE.test(head);
};

const isMhtmlExport = (buffer: Buffer): boolean => {
  const head = buffer.subarray(0, 4096).toString('latin1');
  return /^\s*mime-version:\s*1\.0/im.test(head) || /content-type:\s*multipart\/related/i.test(head);
};

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const decodeQuotedPrintable = (text: string): string => {
  const normalized = text.replace(/=\r?\n/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < normalized.length; i++) {
    const hex = normalized.substr(i + 1, 2);
    if (normalized[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(hex)) {
      bytes.push(parseInt(hex, 16));
      i += 2;
    } else {
      bytes.push(normalized.charCodeAt(i) & 0xff);
    }
  }
  return Buffer.from(bytes).toString('utf8');
};

const extractHtmlFromMhtml = (buffer: Buffer): string => {
  const raw = buffer.toString('latin1');
  const headerEnd = raw.search(/\r?\n\r?\n/);
  const boundaryMatch = (headerEnd === -1 ? raw : raw.slice(0, headerEnd)).match(/boundary="?([^"\r\n;]+)"?/i);
  const parts = boundaryMatch ? raw.split(new RegExp(`--${escapeRegExp(boundaryMatch[1])}(?:--)?\\r?\\n`)) : [raw];

  for (const part of parts) {
    if (!/content-type:\s*text\/html/i.test(part)) {
      continue;
    }
    const partHeaderEnd = part.search(/\r?\n\r?\n/);
    const partHeaders = partHeaderEnd === -1 ? '' : part.slice(0, partHeaderEnd);
    const partBody = partHeaderEnd === -1 ? part : part.slice(partHeaderEnd).replace(/^\r?\n\r?\n/, '');
    if (/content-transfer-encoding:\s*base64/i.test(partHeaders)) {
      return Buffer.from(partBody.replace(/\s+/g, ''), 'base64').toString('utf8');
    }
    if (/content-transfer-encoding:\s*quoted-printable/i.test(partHeaders)) {
      return decodeQuotedPrintable(partBody);
    }
    return Buffer.from(partBody, 'latin1').toString('utf8');
  }
  throw new Error('Could not find an HTML part in this MHTML export.');
};

const NAMED_HTML_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  rsquo: '\u2019',
  lsquo: '\u2018',
  rdquo: '\u201d',
  ldquo: '\u201c',
  mdash: '\u2014',
  ndash: '\u2013',
  hellip: '\u2026',
};

const decodeHtmlEntities = (text: string): string =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return NAMED_HTML_ENTITIES[entity.toLowerCase()] ?? match;
  });

const extractTextFromHtml = (html: string): string => {
  const withoutNonContent = html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  const withLineBreaks = withoutNonContent
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|table|h[1-6])>/gi, '\n');
  const withoutTags = withLineBreaks.replace(/<[^>]+>/g, ' ');
  return decodeHtmlEntities(withoutTags)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n');
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
  if (DOC_EXTENSIONS.has(ext)) {
    if (isMhtmlExport(buffer)) {
      return extractTextFromHtml(extractHtmlFromMhtml(buffer));
    }
    if (isHtmlExport(buffer)) {
      return extractTextFromHtml(buffer.toString('utf8'));
    }
    throw new Error(
      'Legacy binary Word (.doc) files are not supported. Save as .docx or PDF, or upload the HTML export ' +
        '(e.g. Confluence "Export to Word") as-is.',
    );
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
