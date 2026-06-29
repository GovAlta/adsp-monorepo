import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import { extractXfaFields } from './xfaExtractor';
import { Logger } from 'winston';

const MAX_EXTRACTED_IMAGES = 10;
const VISION_SUPPORTED_MIMES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
// DOCX files are ZIP archives; file-service may report this MIME type instead of the DOCX-specific one.
const ZIP_MIME = 'application/zip';

export const EXTRACTABLE_MIMES = [PDF_MIME, DOCX_MIME, ZIP_MIME];

export interface ExtractedImage {
  data: string; // base64
  mimeType: string;
}

export interface DocumentExtractResult {
  text: string;
  format?: 'html' | 'text';
  images?: ExtractedImage[];
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

const LIGATURE_MAP: Record<string, string> = {
  'ﬀ': 'ff',
  'ﬁ': 'fi',
  'ﬂ': 'fl',
  'ﬃ': 'ffi',
  'ﬄ': 'ffl',
  'ﬅ': 'st',
  'ﬆ': 'st',
};

function normalizeLigatures(text: string): string {
  // Unicode range U+FB00–U+FB06: Latin ligatures ﬀ ﬁ ﬂ ﬃ ﬄ ﬅ ﬆ
  return text.replace(/[ﬀ-ﬆ]/g, (ch) => LIGATURE_MAP[ch] ?? ch);
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
      const extractedImages: ExtractedImage[] = [];

      const result = await mammoth.convertToHtml({ buffer }, {
        convertImage: mammoth.images.imgElement(async (image) => {
          if (VISION_SUPPORTED_MIMES.has(image.contentType) && extractedImages.length < MAX_EXTRACTED_IMAGES) {
            const base64 = await image.readAsBase64String();
            extractedImages.push({ data: base64, mimeType: image.contentType });
          }
          return { src: '' };
        }),
      });

      // Replace the empty <img src=""> placeholders with positional markers so the
      // agent knows where each diagram belongs without seeing broken image tags.
      // diagramIndex increments per match so each img tag maps to a sequentially numbered marker.
      let diagramIndex = 0;
      const htmlWithMarkers = normalizeLigatures(result.value).replace(/<img[^>]*\/?>/gi, () => {
        diagramIndex++;
        return `<div class="diagram-placeholder">[DIAGRAM_${diagramIndex}]</div>`;
      });

      return {
        text: htmlWithMarkers,
        format: 'html',
        images: extractedImages.length > 0 ? extractedImages : undefined,
      };
    }
    default:
      return null;
  }
}
