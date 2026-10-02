import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import { extractXfaFields } from './xfaExtractor';
import { Logger } from 'winston';

const MAX_EXTRACTED_IMAGES = 10;
const MAX_RENDERED_PAGES = 10;
// Rendered wide enough for the LLM to read text and judge layout, small enough to keep vision token cost bounded.
const PAGE_RENDER_WIDTH = 1024;
// Page renders are sent as base64 vision parts and replayed from thread memory on later turns;
// cap the total bytes so graphics-heavy documents cannot push requests past provider limits.
const MAX_TOTAL_RENDER_BYTES = 4 * 1024 * 1024;
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

export interface DocumentPageText {
  num: number;
  text: string;
}

export interface ExtractDocumentOptions {
  maxPageImages?: number;
  skipPageImagesIf?: (charCount: number, pageCount: number) => boolean;
}

export interface DocumentExtractResult {
  text: string;
  format?: 'html' | 'text';
  images?: ExtractedImage[];
  // Full-page visual renders (PDF only) so the LLM can see layout, colors, fonts, and
  // field placement that plain text extraction strips out. Capped at MAX_RENDERED_PAGES.
  pageImages?: ExtractedImage[];
  pages?: DocumentPageText[];
  pageCount?: number;
  xfaForm?: boolean;
  // true when pdf-parse found no text layer (scanned/image-only PDF).
  // Callers should send the raw bytes as a file part rather than extracted content.
  scanned?: boolean;
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
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalized) return false;
  return XFA_PLACEHOLDER_PATTERNS.every((pattern) => normalized.includes(pattern));
}

// Render pages as images so the LLM can see the visual design (orientation, margins,
// columns, colors, fonts, field placement) that text extraction cannot convey.
// Returns undefined on failure: text extraction already succeeded by this point, so
// rendering degrades to text-only rather than failing the upload.
// clean-code-ignore: 2.18 — diagnostic logging via the injected logger is the established pattern in this module, not hidden state mutation.
async function renderPdfPageImages(
  parser: PDFParse,
  totalPages: number,
  filename?: string,
  logger?: Logger,
  maxPages: number = MAX_RENDERED_PAGES,
): Promise<ExtractedImage[] | undefined> {
  if (maxPages <= 0) {
    return undefined;
  }

  try {
    const screenshots = await parser.getScreenshot({
      first: Math.min(totalPages, maxPages),
      desiredWidth: PAGE_RENDER_WIDTH,
      imageDataUrl: false,
    });

    const pageImages: ExtractedImage[] = [];
    let totalRenderBytes = 0;
    for (const page of screenshots.pages) {
      totalRenderBytes += page.data.byteLength;
      if (totalRenderBytes > MAX_TOTAL_RENDER_BYTES && pageImages.length > 0) {
        logger?.info(`Stopped page rendering for '${filename}' at ${pageImages.length} page(s); size cap reached.`);
        break;
      }
      pageImages.push({ data: Buffer.from(page.data).toString('base64'), mimeType: 'image/png' });
    }
    return pageImages.length ? pageImages : undefined;
  } catch (err) {
    logger?.warn(
      `Failed to render PDF pages as images for '${filename}': ${err instanceof Error ? err.message : String(err)}`,
    );
    return undefined;
  }
}

export async function extractDocumentText(
  data: Uint8Array,
  mimeType: string,
  filename?: string,
  logger?: Logger,
  options?: ExtractDocumentOptions,
): Promise<DocumentExtractResult | null> {
  const effectiveMime = resolveDocxMime(mimeType, filename);

  switch (effectiveMime) {
    case PDF_MIME: {
      // pdf-parse detaches the ArrayBuffer it receives, so pass it a copy.
      const pdfParseCopy = new Uint8Array(data);
      const parser = new PDFParse({ data: pdfParseCopy });
      try {
        // Always run text extraction and XFA extraction in parallel.
        // allSettled lets each path fail independently: if pdf-parse throws on a
        // malformed PDF, pdfjs may still return XFA content, and vice versa.
        const [textOutcome, xfaOutcome] = await Promise.allSettled([
          parser.getText(),
          extractXfaFields(data, logger),
        ]);

        if (textOutcome.status === 'rejected') {
          logger?.warn(`pdf-parse getText failed for '${filename}': ${textOutcome.reason}`);
        }
        if (xfaOutcome.status === 'rejected') {
          logger?.warn(`XFA extraction failed for '${filename}': ${xfaOutcome.reason}`);
        }

        const textResult = textOutcome.status === 'fulfilled' ? textOutcome.value : null;
        const xfaResult = xfaOutcome.status === 'fulfilled' ? xfaOutcome.value : null;

        // Prefer pdf-parse page count; fall back to pdfjs when pdf-parse failed.
        const pageCount = textResult?.total ?? xfaResult?.pageCount ?? 0;
        const pages = textResult?.pages?.map((page) => ({ num: page.num, text: page.text }));

        // XFA content found: prefer it as the primary result.
        // Prepend real PDF text for filled forms, but suppress Adobe Reader placeholder
        // strings that would add noise without useful content.
        if (xfaResult) {
          const realText = textResult?.text?.trim() && !isXfaPlaceholder(textResult.text)
            ? textResult.text
            : '';
          const text = realText ? `${realText}\n\n${xfaResult.htmlDescription}` : xfaResult.htmlDescription;
          return { text, format: 'html', pageCount, xfaForm: true, pages };
        }

        // No XFA content and no text layer: scanned/image-only PDF.
        if (!textResult?.text?.trim()) {
          return { text: '', pageCount, scanned: true };
        }

        // Normal text extraction: render page images for visual layout context.
        const maxPageImages = options?.maxPageImages ?? MAX_RENDERED_PAGES;
        const skipPageImages = options?.skipPageImagesIf?.(textResult.text.length, pageCount) === true;
        const pageImages = skipPageImages
          ? undefined
          : await renderPdfPageImages(parser, pageCount, filename, logger, maxPageImages);
        return { text: textResult.text, pageCount, pageImages, pages };
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
