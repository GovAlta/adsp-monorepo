/**
 * XFA (XML Forms Architecture) PDF extractor.
 *
 * XFA-based PDFs (created with Adobe LiveCycle Designer) embed form definitions
 * as XML in compressed PDF streams. Standard text extraction tools only return a
 * "Please wait..." placeholder.
 *
 * This module uses a multi-strategy approach:
 *   1. pdfjs-dist with enableXfa — decompresses streams, provides getFieldObjects/allXfaHtml
 *   2. pdf2json fallback — a mature Node.js library that parses PDF form elements including XFA
 *
 * Both approaches handle decompression of PDF streams internally.
 */
import { Logger } from 'winston';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFParser = require('pdf2json');

interface XfaFieldInfo {
  name: string;
  type: string;
  value?: string;
  options?: string[];
  readOnly?: boolean;
}

interface XfaHtmlNode {
  name?: string;
  value?: string;
  attributes?: Record<string, string>;
  children?: XfaHtmlNode[];
}

export interface XfaFormResult {
  fields: XfaFieldInfo[];
  htmlDescription: string;
}

/**
 * Extract form field information from an XFA/AcroForm PDF.
 * Tries pdfjs-dist first, falls back to pdf2json.
 */
export async function extractXfaFields(data: Uint8Array, logger?: Logger): Promise<XfaFormResult | null> {
  // Strategy 1: pdfjs-dist with enableXfa
  const pdfjsResult = await extractWithPdfjs(data, logger);

  if (pdfjsResult && pdfjsResult.fields.length > 0) {
    logger?.info('XFA extraction succeeded via pdfjs-dist', { fieldCount: pdfjsResult.fields.length });
    return pdfjsResult;
  }

  logger?.info('pdfjs-dist returned no fields, trying pdf2json fallback...');

  // Strategy 2: pdf2json fallback
  const pdf2jsonResult = await extractWithPdf2json(data, logger);

  if (pdf2jsonResult && pdf2jsonResult.fields.length > 0) {
    logger?.info('XFA extraction succeeded via pdf2json', { fieldCount: pdf2jsonResult.fields.length });
    return pdf2jsonResult;
  }

  // If pdfjs found layout info (allXfaHtml) but no structured fields, still return it
  if (pdfjsResult && pdfjsResult.htmlDescription.length > 50) {
    logger?.info('Returning pdfjs-dist layout info without structured fields');
    return pdfjsResult;
  }

  logger?.warn('All XFA extraction strategies failed');
  return null;
}

// ─── Strategy 1: pdfjs-dist ────────────────────────────────────────────────────

async function extractWithPdfjs(data: Uint8Array, logger?: Logger): Promise<XfaFormResult | null> {
  let doc;
  try {
    const loadingTask = pdfjsLib.getDocument({ data, enableXfa: true, isEvalSupported: false });
    doc = await loadingTask.promise;
  } catch (err) {
    const msg = (err as Error).message;
    logger?.warn('pdfjs-dist failed to load document', { error: msg });
    return null;
  }

  try {
    const fields: XfaFieldInfo[] = [];
    const lines: string[] = [];

    // Method 1: getFieldObjects() — works for both AcroForm AND XFA forms
    try {
      const fieldObjects = await doc.getFieldObjects();
      const fieldCount = fieldObjects ? Object.keys(fieldObjects).length : 0;

      if (fieldObjects && fieldCount > 0) {
        lines.push('## Form Fields\n');
        lines.push('| Field Name | Type | Options/Value | Read Only |');
        lines.push('|---|---|---|---|');

        for (const [name, fieldArray] of Object.entries(fieldObjects)) {
          for (const field of fieldArray as Array<Record<string, unknown>>) {
            const info: XfaFieldInfo = {
              name,
              type: mapFieldType(field.type as string),
              value: (field.value as string) || undefined,
              readOnly: (field.readOnly as boolean) || undefined,
            };

            if (Array.isArray(field.options)) {
              info.options = (field.options as Array<{ displayValue?: string; exportValue?: string }>)
                .map((o) => (typeof o === 'string' ? o : o.displayValue || o.exportValue || ''))
                .filter(Boolean);
            }

            fields.push(info);

            const optionsStr = info.options
              ? info.options.slice(0, 8).join(', ') + (info.options.length > 8 ? '...' : '')
              : info.value || '';
            lines.push(`| ${info.name} | ${info.type} | ${optionsStr} | ${info.readOnly ? 'Yes' : ''} |`);
          }
        }
        lines.push('');
      }
    } catch (err) {
      logger?.warn('pdfjs getFieldObjects failed', { error: (err as Error).message });
    }

    // Method 2: allXfaHtml — gives the full XFA rendering tree
    try {
      const xfaHtml = doc.allXfaHtml as XfaHtmlNode | null;

      if (xfaHtml) {
        lines.push('## XFA Form Layout\n');
        const layoutText = walkXfaHtml(xfaHtml, 0);
        lines.push(layoutText);
      }
    } catch (err) {
      logger?.warn('pdfjs allXfaHtml failed', { error: (err as Error).message });
    }

    // Method 3: Per-page annotations (fallback for forms with no field objects)
    if (fields.length === 0) {
      try {
        const numPages = doc.numPages;
        for (let i = 1; i <= numPages; i++) {
          const page = await doc.getPage(i);

          // Try page-level XFA
          try {
            const xfaData = await page.getXfa();
            if (xfaData) {
              lines.push(`### Page ${i} (XFA)`);
              const pageText = walkXfaHtml(xfaData as XfaHtmlNode, 0);
              lines.push(pageText);
            }
          } catch {
            // getXfa not available in all pdfjs versions
          }

          // Also try annotations which contain form widget info
          const annotations = await page.getAnnotations();
          for (const annot of annotations) {
            if (annot.fieldType || annot.fieldName) {
              fields.push({
                name: annot.fieldName || annot.id || 'unnamed',
                type: mapFieldType(annot.fieldType),
                value: annot.fieldValue || undefined,
                readOnly: annot.readOnly || undefined,
                options: annot.options?.map((o: { displayValue: string }) => o.displayValue).filter(Boolean),
              });
            }
          }
        }

        if (fields.length > 0) {
          lines.push('\n## Extracted Fields from Annotations\n');
          lines.push('| Field Name | Type | Options/Value | Read Only |');
          lines.push('|---|---|---|---|');
          for (const f of fields) {
            const optionsStr = f.options ? f.options.slice(0, 8).join(', ') : f.value || '';
            lines.push(`| ${f.name} | ${f.type} | ${optionsStr} | ${f.readOnly ? 'Yes' : ''} |`);
          }
        }
      } catch (err) {
        logger?.warn('pdfjs annotation extraction failed', { error: (err as Error).message });
      }
    }

    if (fields.length === 0 && lines.length <= 2) {
      return null;
    }

    lines.push(`\n**Total: ${fields.length} fields extracted**`);
    return { fields, htmlDescription: lines.join('\n') };
  } finally {
    await doc.destroy();
  }
}

// ─── Strategy 2: pdf2json ──────────────────────────────────────────────────────

async function extractWithPdf2json(data: Uint8Array, logger?: Logger): Promise<XfaFormResult | null> {
  return new Promise((resolve) => {
    try {
      const pdfParser = new PDFParser(null, 1);

      // Set a timeout to avoid hanging indefinitely
      const timeout = setTimeout(() => {
        logger?.warn('pdf2json timed out after 30s');
        resolve(null);
      }, 30000);

      pdfParser.on('pdfParser_dataError', (errData: { parserError: Error }) => {
        clearTimeout(timeout);
        logger?.warn('pdf2json parse error', { error: errData.parserError?.message });
        resolve(null);
      });

      pdfParser.on('pdfParser_dataReady', (pdfData: Pdf2jsonData) => {
        clearTimeout(timeout);
        try {
          const result = parsePdf2jsonOutput(pdfData, pdfParser, logger);
          resolve(result);
        } catch (err) {
          logger?.warn('pdf2json output parsing failed', { error: (err as Error).message });
          resolve(null);
        }
      });

      // pdf2json accepts a Buffer
      pdfParser.parseBuffer(Buffer.from(data));
    } catch (err) {
      logger?.warn('pdf2json initialization failed', { error: (err as Error).message });
      resolve(null);
    }
  });
}

// pdf2json data types
interface Pdf2jsonField {
  id?: { Id: string };
  T?: { Name: string };
  TU?: string;
  V?: string;
  AM?: number;
  PL?: { D?: string[]; V?: string[] };
}

interface Pdf2jsonBox {
  id?: { Id: string };
  T?: { Name: string };
}

interface Pdf2jsonBoxset {
  id?: { Id: string };
  boxes?: Pdf2jsonBox[];
}

interface Pdf2jsonPage {
  Fields?: Pdf2jsonField[];
  Boxsets?: Pdf2jsonBoxset[];
  Texts?: Array<{ R?: Array<{ T: string }> }>;
}

interface Pdf2jsonData {
  Pages?: Pdf2jsonPage[];
  Meta?: Record<string, unknown>;
}

function parsePdf2jsonOutput(
  pdfData: Pdf2jsonData,
  pdfParser: { getAllFieldsTypes: () => Pdf2jsonField[]; getRawTextContent: () => string },
  logger?: Logger,
): XfaFormResult | null {
  const fields: XfaFieldInfo[] = [];
  const lines: string[] = [];

  // getAllFieldsTypes gives a flat list of form fields
  const allFields = pdfParser.getAllFieldsTypes();

  if (allFields && allFields.length > 0) {
    lines.push('## Form Fields (pdf2json)\n');
    lines.push('| Field Name | Type | Options/Value | Read Only |');
    lines.push('|---|---|---|---|');

    for (const field of allFields) {
      const name = field.id?.Id || 'unnamed';
      const type = field.T?.Name || 'unknown';
      const readOnly = field.AM ? (field.AM & 0x00000400) !== 0 : false;

      const info: XfaFieldInfo = {
        name,
        type: mapPdf2jsonFieldType(type),
        value: field.V || undefined,
        readOnly: readOnly || undefined,
      };

      // Dropdown options
      if (field.PL?.D) {
        info.options = field.PL.D;
      }

      fields.push(info);

      const optionsStr = info.options ? info.options.slice(0, 8).join(', ') : info.value || '';
      lines.push(`| ${info.name} | ${info.type} | ${optionsStr} | ${info.readOnly ? 'Yes' : ''} |`);
    }
    lines.push('');
  }

  // Also extract text content for context
  const rawText = pdfParser.getRawTextContent();
  if (rawText && rawText.trim().length > 20) {
    // Only include first 3000 chars of text content to avoid overwhelming the LLM
    const truncated = rawText.length > 3000 ? rawText.substring(0, 3000) + '\n...(truncated)' : rawText;
    lines.push('## Document Text Content\n');
    lines.push(truncated);
  }

  if (fields.length === 0 && lines.length <= 2) {
    return null;
  }

  lines.push(`\n**Total: ${fields.length} fields extracted**`);
  return { fields, htmlDescription: lines.join('\n') };
}

function mapPdf2jsonFieldType(type: string): string {
  switch (type) {
    case 'alpha':
      return 'text';
    case 'number':
      return 'number';
    case 'date':
      return 'date';
    case 'ssn':
      return 'ssn';
    case 'zip':
      return 'zip';
    case 'phone':
      return 'phone';
    case 'percent':
      return 'percent';
    case 'box':
      return 'checkbox';
    case 'link':
      return 'link';
    case 'signature':
      return 'signature';
    case 'mask':
      return 'masked-input';
    default:
      return type || 'unknown';
  }
}

// ─── Shared utilities ──────────────────────────────────────────────────────────

function mapFieldType(type: string | undefined): string {
  switch (type) {
    case 'Tx':
      return 'text';
    case 'Btn':
      return 'button/checkbox';
    case 'Ch':
      return 'dropdown/listbox';
    case 'Sig':
      return 'signature';
    case 'text':
      return 'text';
    case 'checkbox':
      return 'checkbox';
    case 'radiobutton':
      return 'radio';
    case 'combobox':
      return 'dropdown';
    case 'listbox':
      return 'listbox';
    default:
      return type || 'unknown';
  }
}

/**
 * Walk the XFA HTML tree produced by pdfjs-dist and extract readable text.
 */
function walkXfaHtml(node: XfaHtmlNode, depth: number): string {
  if (!node) return '';

  const lines: string[] = [];
  const indent = '  '.repeat(Math.min(depth, 6));

  if (node.value && typeof node.value === 'string' && node.value.trim()) {
    lines.push(`${indent}${node.value.trim()}`);
  }

  const className = node.attributes?.class || '';
  const xfaName = node.attributes?.['xfaName'] || '';

  if (xfaName) {
    if (className.includes('xfaSubform')) {
      lines.push(`${indent}[Section: ${xfaName}]`);
    } else if (className.includes('xfaField')) {
      lines.push(`${indent}[Field: ${xfaName}]`);
    } else {
      lines.push(`${indent}[${xfaName}]`);
    }
  }

  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      const childText = walkXfaHtml(child, depth + 1);
      if (childText) lines.push(childText);
    }
  }

  return lines.join('\n');
}
