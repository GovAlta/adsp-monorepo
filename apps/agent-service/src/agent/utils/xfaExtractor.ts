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
import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFParser = require('pdf2json');

const DEBUG_DIR = path.resolve('apps/agent-service/src/agent/processors/extracted');

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
  const debugLog: string[] = [];
  const ts = new Date().toISOString().replace(/[:.]/g, '-');

  debugLog.push(`=== XFA Extraction Debug Log ===`);
  debugLog.push(`Timestamp: ${new Date().toISOString()}`);
  debugLog.push(`PDF data size: ${data.length} bytes`);
  debugLog.push(
    `First 20 bytes: ${Array.from(data.slice(0, 20))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ')}`,
  );
  debugLog.push('');

  // Strategy 1: pdfjs-dist with enableXfa
  debugLog.push('--- Strategy 1: pdfjs-dist (enableXfa: true) ---');
  const pdfjsResult = await extractWithPdfjs(data, logger, debugLog);
  debugLog.push(
    `pdfjs result: fields=${pdfjsResult?.fields?.length || 0}, descLen=${pdfjsResult?.htmlDescription?.length || 0}`,
  );
  debugLog.push('');

  if (pdfjsResult && pdfjsResult.fields.length > 0) {
    logger?.info('XFA extraction succeeded via pdfjs-dist', { fieldCount: pdfjsResult.fields.length });
    debugLog.push('>>> WINNER: pdfjs-dist');
    writeDebugLog(debugLog, `xfa-debug_${ts}.txt`);
    return pdfjsResult;
  }

  logger?.info('pdfjs-dist returned no fields, trying pdf2json fallback...');

  // Strategy 2: pdf2json fallback
  debugLog.push('--- Strategy 2: pdf2json ---');
  const pdf2jsonResult = await extractWithPdf2json(data, logger, debugLog);
  debugLog.push(
    `pdf2json result: fields=${pdf2jsonResult?.fields?.length || 0}, descLen=${pdf2jsonResult?.htmlDescription?.length || 0}`,
  );
  debugLog.push('');

  if (pdf2jsonResult && pdf2jsonResult.fields.length > 0) {
    logger?.info('XFA extraction succeeded via pdf2json', { fieldCount: pdf2jsonResult.fields.length });
    debugLog.push('>>> WINNER: pdf2json');
    writeDebugLog(debugLog, `xfa-debug_${ts}.txt`);
    return pdf2jsonResult;
  }

  // If pdfjs found layout info (allXfaHtml) but no structured fields, still return it
  if (pdfjsResult && pdfjsResult.htmlDescription.length > 50) {
    logger?.info('Returning pdfjs-dist layout info without structured fields');
    debugLog.push('>>> WINNER: pdfjs-dist (layout only, no structured fields)');
    writeDebugLog(debugLog, `xfa-debug_${ts}.txt`);
    return pdfjsResult;
  }

  logger?.warn('All XFA extraction strategies failed');
  debugLog.push('>>> ALL STRATEGIES FAILED');
  writeDebugLog(debugLog, `xfa-debug_${ts}.txt`);
  return null;
}

function writeDebugLog(lines: string[], filename: string): void {
  try {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
    const filePath = path.join(DEBUG_DIR, filename);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
  } catch {
    // Ignore write errors in debug logging
  }
}

// ─── Strategy 1: pdfjs-dist ────────────────────────────────────────────────────

async function extractWithPdfjs(data: Uint8Array, logger?: Logger, debugLog?: string[]): Promise<XfaFormResult | null> {
  let doc;
  try {
    const loadingTask = pdfjsLib.getDocument({ data, enableXfa: true, isEvalSupported: false });
    doc = await loadingTask.promise;
    debugLog?.push(`pdfjs: Document loaded OK. numPages=${doc.numPages}`);

    // Log metadata for debugging
    try {
      const metadata = await doc.getMetadata();
      debugLog?.push(`pdfjs metadata.info: ${JSON.stringify(metadata?.info || {}).substring(0, 500)}`);
      const isXFAPresent = metadata?.info?.IsXFAPresent;
      const isAcroFormPresent = metadata?.info?.IsAcroFormPresent;
      debugLog?.push(`pdfjs: IsXFAPresent=${isXFAPresent}, IsAcroFormPresent=${isAcroFormPresent}`);
    } catch (metaErr) {
      debugLog?.push(`pdfjs: getMetadata() ERROR: ${(metaErr as Error).message}`);
    }
  } catch (err) {
    const msg = (err as Error).message;
    debugLog?.push(`pdfjs: FAILED to load document: ${msg}`);
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
      debugLog?.push(`pdfjs.getFieldObjects(): ${fieldCount} field groups`);
      if (fieldObjects && fieldCount > 0) {
        const keys = Object.keys(fieldObjects).slice(0, 10);
        debugLog?.push(`  Sample keys: ${keys.join(', ')}${fieldCount > 10 ? '...' : ''}`);
        // Log first field's full structure for debugging
        const firstKey = keys[0];
        if (firstKey) {
          debugLog?.push(`  First field raw: ${JSON.stringify(fieldObjects[firstKey]).substring(0, 500)}`);
        }
      } else {
        debugLog?.push(`  fieldObjects value: ${JSON.stringify(fieldObjects)?.substring(0, 200)}`);
      }
      logger?.debug('pdfjs getFieldObjects returned', { fieldCount });

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
      debugLog?.push(`pdfjs.getFieldObjects() ERROR: ${(err as Error).message}`);
      logger?.debug('pdfjs getFieldObjects failed', { error: (err as Error).message });
    }

    // Method 2: allXfaHtml — gives the full XFA rendering tree
    try {
      const xfaHtml = doc.allXfaHtml as XfaHtmlNode | null;
      debugLog?.push(`pdfjs.allXfaHtml: ${xfaHtml ? 'PRESENT' : 'null/undefined'}`);
      if (xfaHtml) {
        debugLog?.push(`  allXfaHtml type: ${typeof xfaHtml}`);
        debugLog?.push(`  allXfaHtml keys: ${Object.keys(xfaHtml).join(', ')}`);
        debugLog?.push(`  allXfaHtml raw (first 1000 chars): ${JSON.stringify(xfaHtml).substring(0, 1000)}`);
      }
      logger?.debug('pdfjs allXfaHtml present', { hasXfa: !!xfaHtml });

      if (xfaHtml) {
        lines.push('## XFA Form Layout\n');
        const layoutText = walkXfaHtml(xfaHtml, 0);
        lines.push(layoutText);
      }
    } catch (err) {
      debugLog?.push(`pdfjs.allXfaHtml ERROR: ${(err as Error).message}`);
      logger?.debug('pdfjs allXfaHtml failed', { error: (err as Error).message });
    }

    // Method 3: Per-page annotations (fallback for forms with no field objects)
    if (fields.length === 0) {
      try {
        const numPages = doc.numPages;
        debugLog?.push(`pdfjs: Trying per-page extraction (${numPages} pages)`);
        for (let i = 1; i <= numPages; i++) {
          const page = await doc.getPage(i);

          // Try page-level XFA
          try {
            const xfaData = await page.getXfa();
            debugLog?.push(`  Page ${i} getXfa(): ${xfaData ? 'PRESENT' : 'null'}`);
            if (xfaData) {
              debugLog?.push(`    getXfa raw (first 500): ${JSON.stringify(xfaData).substring(0, 500)}`);
              lines.push(`### Page ${i} (XFA)`);
              const pageText = walkXfaHtml(xfaData as XfaHtmlNode, 0);
              lines.push(pageText);
            }
          } catch (xfaErr) {
            debugLog?.push(`  Page ${i} getXfa() ERROR: ${(xfaErr as Error).message}`);
            // getXfa not available in all pdfjs versions
          }

          // Also try annotations which contain form widget info
          const annotations = await page.getAnnotations();
          debugLog?.push(`  Page ${i} annotations: ${annotations.length} total`);
          if (annotations.length > 0) {
            const sample = annotations
              .slice(0, 3)
              .map((a: Record<string, unknown>) =>
                JSON.stringify({
                  subtype: a.subtype,
                  fieldType: a.fieldType,
                  fieldName: a.fieldName,
                  fieldValue: a.fieldValue,
                }),
              );
            debugLog?.push(`    Sample annotations: ${sample.join('; ')}`);
          }
          logger?.debug(`Page ${i} annotations`, { count: annotations.length });
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
        debugLog?.push(`pdfjs annotation loop ERROR: ${(err as Error).message}`);
        logger?.debug('pdfjs annotation extraction failed', { error: (err as Error).message });
      }
    }

    debugLog?.push(`pdfjs final: ${fields.length} fields, ${lines.length} line entries`);

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

async function extractWithPdf2json(
  data: Uint8Array,
  logger?: Logger,
  debugLog?: string[],
): Promise<XfaFormResult | null> {
  return new Promise((resolve) => {
    try {
      const pdfParser = new PDFParser(null, 1);
      debugLog?.push('pdf2json: Parser created, parsing buffer...');

      // Set a timeout to avoid hanging indefinitely
      const timeout = setTimeout(() => {
        debugLog?.push('pdf2json: TIMEOUT after 30s');
        logger?.warn('pdf2json timed out after 30s');
        resolve(null);
      }, 30000);

      pdfParser.on('pdfParser_dataError', (errData: { parserError: Error }) => {
        clearTimeout(timeout);
        debugLog?.push(`pdf2json: PARSE ERROR: ${errData.parserError?.message}`);
        logger?.warn('pdf2json parse error', { error: errData.parserError?.message });
        resolve(null);
      });

      pdfParser.on('pdfParser_dataReady', (pdfData: Pdf2jsonData) => {
        clearTimeout(timeout);
        try {
          debugLog?.push(`pdf2json: Data ready. Pages=${pdfData.Pages?.length || 0}`);
          debugLog?.push(`pdf2json: Meta=${JSON.stringify(pdfData.Meta || {}).substring(0, 500)}`);
          if (pdfData.Pages && pdfData.Pages.length > 0) {
            const page0 = pdfData.Pages[0];
            debugLog?.push(
              `pdf2json: Page 0: Fields=${page0.Fields?.length || 0}, Boxsets=${page0.Boxsets?.length || 0}, Texts=${page0.Texts?.length || 0}`,
            );
            if (page0.Fields && page0.Fields.length > 0) {
              debugLog?.push(`pdf2json: First field raw: ${JSON.stringify(page0.Fields[0]).substring(0, 300)}`);
            }
            if (page0.Texts && page0.Texts.length > 0) {
              const sampleTexts = page0.Texts.slice(0, 5)
                .map((t: { R?: Array<{ T: string }> }) => t.R?.[0]?.T)
                .filter(Boolean);
              debugLog?.push(`pdf2json: Sample texts: ${sampleTexts.join(' | ')}`);
            }
          }

          const result = parsePdf2jsonOutput(pdfData, pdfParser, logger, debugLog);
          resolve(result);
        } catch (err) {
          debugLog?.push(`pdf2json: Output parsing ERROR: ${(err as Error).message}\n${(err as Error).stack}`);
          logger?.warn('pdf2json output parsing failed', { error: (err as Error).message });
          resolve(null);
        }
      });

      // pdf2json accepts a Buffer
      pdfParser.parseBuffer(Buffer.from(data));
    } catch (err) {
      debugLog?.push(`pdf2json: Init ERROR: ${(err as Error).message}`);
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
  debugLog?: string[],
): XfaFormResult | null {
  const fields: XfaFieldInfo[] = [];
  const lines: string[] = [];

  // getAllFieldsTypes gives a flat list of form fields
  const allFields = pdfParser.getAllFieldsTypes();
  debugLog?.push(`pdf2json getAllFieldsTypes(): ${allFields?.length || 0} fields`);
  if (allFields && allFields.length > 0) {
    debugLog?.push(`pdf2json first field: ${JSON.stringify(allFields[0]).substring(0, 300)}`);
  }
  logger?.debug('pdf2json getAllFieldsTypes', { count: allFields?.length || 0 });

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
  debugLog?.push(`pdf2json getRawTextContent(): ${rawText?.length || 0} chars`);
  if (rawText) {
    debugLog?.push(`pdf2json rawText (first 500): ${rawText.substring(0, 500)}`);
  }
  if (rawText && rawText.trim().length > 20) {
    // Only include first 3000 chars of text content to avoid overwhelming the LLM
    const truncated = rawText.length > 3000 ? rawText.substring(0, 3000) + '\n...(truncated)' : rawText;
    lines.push('## Document Text Content\n');
    lines.push(truncated);
  }

  logger?.debug('pdf2json extraction result', { fieldCount: fields.length, textLength: rawText?.length || 0 });

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
