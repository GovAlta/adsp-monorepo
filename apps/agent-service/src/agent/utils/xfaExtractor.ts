/**
 * XFA (XML Forms Architecture) PDF extractor.
 *
 * XFA-based PDFs (created with Adobe LiveCycle Designer) embed form definitions
 * as XML in compressed PDF streams. Standard text extraction tools only return a
 * "Please wait..." placeholder.
 *
 * Uses pdfjs-dist with enableXfa, which decompresses streams and provides
 * getFieldObjects() for field metadata and allXfaHtml for the full form layout.
 */
import { Logger } from 'winston';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

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
 * Extract form field information from an XFA/AcroForm PDF using pdfjs-dist.
 * Returns null when no fields or layout content are found (non-form / scanned PDF).
 */
export async function extractXfaFields(data: Uint8Array, logger?: Logger): Promise<XfaFormResult | null> {
  return extractWithPdfjs(data, logger);
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

    const htmlDescription = lines.join('\n');
    // lines.length is not a reliable emptiness check: the entire walkXfaHtml result
    // is one string, so header + walk = 2 lines even for a 56KB allXfaHtml tree.
    // Use content length instead: < 50 chars means only empty header lines were emitted.
    if (fields.length === 0 && htmlDescription.length < 50) {
      return null;
    }

    lines.push(`\n**Total: ${fields.length} fields extracted**`);
    return { fields, htmlDescription: lines.join('\n') };
  } finally {
    await doc.destroy();
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
    // pdfjs sometimes emits both the master-page template and the rendered page content
    // as same-named siblings. Skip the duplicate so the form is described only once.
    const seenNames = new Set<string>();
    for (const child of node.children) {
      const childName = child.attributes?.['xfaName'];
      if (childName) {
        if (seenNames.has(childName)) continue;
        seenNames.add(childName);
      }
      const childText = walkXfaHtml(child, depth + 1);
      if (childText) lines.push(childText);
    }
  }

  return lines.join('\n');
}
