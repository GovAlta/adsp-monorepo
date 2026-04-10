import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import { extractXfaFields } from './xfaExtractor';
import { Logger } from 'winston';

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
// DOCX files are ZIP archives; file-service may report this MIME type instead of the DOCX-specific one.
const ZIP_MIME = 'application/zip';

export const EXTRACTABLE_MIMES = [PDF_MIME, DOCX_MIME, ZIP_MIME];

export interface DocumentExtractResult {
  text: string;
  pageCount?: number;
  xfaForm?: boolean;
}

export function isExtractableDocument(mimeType: string, filename?: string): boolean {
  if (EXTRACTABLE_MIMES.includes(mimeType)) {
    return true;
  }
  // Fallback: check file extension for DOCX files that arrive as application/zip or octet-stream
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop();
    return ext === 'pdf' || ext === 'docx';
  }
  return false;
}

function resolveDocxMime(mimeType: string, filename?: string): string {
  // If the MIME is generic (zip/octet-stream) but filename is .docx, treat as DOCX
  if (mimeType === ZIP_MIME || mimeType === 'application/octet-stream') {
    if (filename?.toLowerCase().endsWith('.docx')) {
      return DOCX_MIME;
    }
  }
  return mimeType;
}

// XFA/dynamic PDF forms embed content as XML, not standard PDF text.
// pdf-parse returns only the Adobe Reader placeholder for these forms.
const XFA_PLACEHOLDER_PATTERNS = [
  'please wait',
  'if this message is not eventually replaced',
  'adobe reader',
  'pdf viewer may not be able to display',
];

function isXfaPlaceholder(text: string): boolean {
  // Normalize: lowercase and collapse all whitespace (newlines, tabs, etc.) into single spaces
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalized || normalized.length < 20) return true;
  return XFA_PLACEHOLDER_PATTERNS.every((pattern) => normalized.includes(pattern));
}

export async function extractDocumentText(
  data: Uint8Array,
  mimeType: string,
  filename?: string,
  logger?: Logger,
): Promise<DocumentExtractResult | null> {
  const effectiveMime = resolveDocxMime(mimeType, filename);

  switch (effectiveMime) {
    case PDF_MIME: {
      // pdf-parse detaches the ArrayBuffer it receives, so pass it a copy
      // and keep the original intact for XFA extraction.
      const pdfParseCopy = new Uint8Array(data);
      const parser = new PDFParse({ data: pdfParseCopy });
      try {
        const result = await parser.getText();
        if (isXfaPlaceholder(result.text)) {
          // XFA form detected — extract form structure using pdfjs-dist + pdf2json
          logger?.info('XFA placeholder detected, attempting XFA extraction...', { filename });
          const xfaResult = await extractXfaFields(data, logger);
          if (xfaResult) {
            return { text: xfaResult.htmlDescription, pageCount: result.total, xfaForm: true };
          }
          return { text: '', pageCount: result.total, xfaForm: true };
        }
        return { text: result.text, pageCount: result.total };
      } finally {
        await parser.destroy();
      }
    }
    case DOCX_MIME: {
      const buffer = Buffer.from(data);
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value };
    }
    default:
      return null;
  }
}
