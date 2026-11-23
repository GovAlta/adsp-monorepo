import { PDF_TEMPLATE_FIELDS, PdfDefinition, PdfTemplateFields } from './types';

/**
 * The model's view of a saved PDF template. Long image data URIs (such as the inline SVG logo in the default header and
 * footer) and long comments (the default template's tutorial notes) are most of a typical template's tokens and are
 * rarely edited, so the model sees a short placeholder for each, and a save puts the original back. Placeholders are
 * numbered in the order they occur in the fields, so the same saved template always gives the same numbers.
 */

export const MIN_ELIDED_LENGTH = 200;

const PLACEHOLDER_PREFIX = '[[elided-';
const PLACEHOLDER = /\[\[elided-(?:asset|comment)-(\d+)\]\]/g;
// Comment openings, and data URIs with a media type (data:image/svg+xml, or data:font/woff2;base64,).
const ELIDABLE_START = /<!--|\/\*|data:[a-z]+\/[\w.+-]+[;,]/gi;

type ElidedKind = 'asset' | 'comment';

export interface ElidedTemplate {
  /** The fields with placeholders in place of long data URIs and comments. */
  fields: PdfTemplateFields;
  /** The original text of each placeholder; [[elided-asset-1]] is the first entry. */
  elided: string[];
}

export interface RestoredFields {
  fields: PdfTemplateFields;
  /** Placeholders that do not stand for anything in the saved template. */
  unknown: string[];
}

function dataUriEnd(value: string, start: number): number {
  const opening = value[start - 1];
  const closing = opening === '"' || opening === "'" ? opening : opening === '(' ? ')' : undefined;
  if (closing) {
    const end = value.indexOf(closing, start);
    return end < 0 ? value.length : end;
  }
  const end = value.slice(start).search(/[\s>]/);
  return end < 0 ? value.length : start + end;
}

function elidableRange(value: string, start: number, opening: string) {
  if (opening === '<!--' || opening === '/*') {
    const closing = opening === '<!--' ? '-->' : '*/';
    const contentStart = start + opening.length;
    const contentEnd = value.indexOf(closing, contentStart);
    return contentEnd < 0
      ? undefined
      : { contentStart, contentEnd, end: contentEnd + closing.length, kind: 'comment' as ElidedKind };
  }

  const contentEnd = dataUriEnd(value, start);
  return { contentStart: start, contentEnd, end: contentEnd, kind: 'asset' as ElidedKind };
}

function elideValue(value: string, placeholderFor: (original: string, kind: ElidedKind) => string): string {
  const pattern = new RegExp(ELIDABLE_START.source, ELIDABLE_START.flags);
  let result = '';
  let copiedTo = 0;

  for (let match = pattern.exec(value); match; match = pattern.exec(value)) {
    const range = elidableRange(value, match.index, match[0]);
    if (!range) {
      continue;
    }

    const content = value.slice(range.contentStart, range.contentEnd);
    if (content.length >= MIN_ELIDED_LENGTH) {
      result += value.slice(copiedTo, range.contentStart) + placeholderFor(content, range.kind);
      copiedTo = range.contentEnd;
    }
    pattern.lastIndex = range.end;
  }

  return result + value.slice(copiedTo);
}

export function elideTemplate(definition: PdfTemplateFields): ElidedTemplate {
  const values = PDF_TEMPLATE_FIELDS.map((field) => definition[field]);
  // A template that already contains placeholder text is shown as it is, so restoring a save cannot change it.
  if (values.some((value) => value?.includes(PLACEHOLDER_PREFIX))) {
    return { fields: pickFields(definition), elided: [] };
  }

  const elided: string[] = [];
  const placeholderFor = (original: string, kind: ElidedKind) => {
    let index = elided.indexOf(original);
    if (index < 0) {
      index = elided.push(original) - 1;
    }
    return `${PLACEHOLDER_PREFIX}${kind}-${index + 1}]]`;
  };

  const fields: PdfTemplateFields = {};
  for (const field of PDF_TEMPLATE_FIELDS) {
    const value = definition[field];
    if (typeof value === 'string') {
      fields[field] = elideValue(value, placeholderFor);
    }
  }

  return { fields, elided };
}

/** Puts back the text that each placeholder in the given fields stands for. */
export function restoreElided(fields: PdfTemplateFields, elided: readonly string[]): RestoredFields {
  const unknown = new Set<string>();
  const restored: PdfTemplateFields = {};

  for (const field of PDF_TEMPLATE_FIELDS) {
    const value = fields[field];
    if (typeof value !== 'string') {
      continue;
    }
    restored[field] = value.replace(PLACEHOLDER, (placeholder, number: string) => {
      const original = elided[Number(number) - 1];
      if (original === undefined) {
        unknown.add(placeholder);
        return placeholder;
      }
      return original;
    });
  }

  return { fields: restored, unknown: [...unknown] };
}

/** The saved template as the model sees it: each field under a heading, with long data URIs and comments elided. */
export function describeTemplate(definition: PdfDefinition): string {
  const { fields } = elideTemplate(definition);
  const lines = [`Current PDF template "${definition.name || definition.id || 'untitled'}" (saved):`];
  for (const field of PDF_TEMPLATE_FIELDS) {
    const value = fields[field];
    lines.push(`=== ${field} ===`, value?.trim() ? value : '(empty)');
  }
  return lines.join('\n');
}

function pickFields(definition: PdfTemplateFields): PdfTemplateFields {
  const fields: PdfTemplateFields = {};
  for (const field of PDF_TEMPLATE_FIELDS) {
    if (typeof definition[field] === 'string') {
      fields[field] = definition[field];
    }
  }
  return fields;
}
