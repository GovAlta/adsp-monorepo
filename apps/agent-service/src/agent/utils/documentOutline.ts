import { DocumentExtractResult } from './documentParser';
import { OUTLINE_SECTION_CHAR_CAP, truncateText } from './documentSize';

export interface DocumentOutlineSection {
  sectionId: string;
  title: string;
  text: string;
  /** The title was made up here (a page number, or 'Document'), not taken from the document. */
  untitled?: boolean;
}

export interface DocumentOutline {
  filename: string;
  urn: string;
  pageCount?: number;
  charCount: number;
  sections: DocumentOutlineSection[];
}

export function buildDocumentOutline(extracted: DocumentExtractResult, filename: string, urn: string): DocumentOutline {
  const sections = outlineSections(extracted);
  return {
    filename,
    urn,
    pageCount: extracted.pageCount,
    charCount: extracted.text?.length ?? 0,
    sections,
  };
}

/**
 * Starts the section text of a large document in the message that carries it. Everything before it is the outline,
 * which is all a model is sent; the text after it stays in the message for the prompt injection check and memory.
 */
export const DOCUMENT_SECTION_TEXT_MARKER = '[[Section text follows. It is read by the tools, not sent to the agent.]]';

/** A large document's message: its outline, then any note about the file, then its section text. */
export function formatDocumentOutline(outline: DocumentOutline, note = ''): string {
  const header =
    `Provided document '${outline.filename}' (file service URN: ${outline.urn}) is large ` +
    `(charCount: ${outline.charCount}${outline.pageCount ? `, pageCount: ${outline.pageCount}` : ''}). ` +
    `Its sections follow.`;

  const sectionList = outline.sections
    .map((section) => `- ${section.sectionId}: ${section.title} (${section.text.length} characters)`)
    .join('\n');

  const text = outline.sections
    .map((section) => `### ${section.sectionId}: ${section.title}\n${section.text}`)
    .join('\n\n');

  return `${header}\n\n## Outline\n\n${sectionList}${note}\n\n${DOCUMENT_SECTION_TEXT_MARKER}\n\n${text}`;
}

/** The outline of a large document's message, without its section text; any other text is returned as it is. */
export function withoutDocumentSectionText(text: string): string {
  const marker = text.indexOf(DOCUMENT_SECTION_TEXT_MARKER);
  return marker < 0 ? text : text.slice(0, marker).trimEnd();
}

/** The section of an outline with the given ID, ignoring case. */
export function findOutlineSection(outline: DocumentOutline, sectionId: string): DocumentOutlineSection | undefined {
  const wanted = sectionId.trim().toLowerCase();
  return outline.sections.find((section) => section.sectionId.toLowerCase() === wanted);
}

function outlineSections(extracted: DocumentExtractResult): DocumentOutlineSection[] {
  const text = extracted.text ?? '';
  if (extracted.format === 'html' || extracted.xfaForm) {
    return outlineFromHtml(text);
  }

  const categorySections = outlineFromCategoryMarkers(text);
  if (categorySections.length >= 2) {
    return categorySections;
  }

  if (extracted.pages?.length) {
    return extracted.pages.map((page) => ({
      sectionId: `page-${page.num}`,
      title: `Page ${page.num}`,
      text: truncateText(page.text ?? '', OUTLINE_SECTION_CHAR_CAP).text,
      untitled: true,
    }));
  }

  return [singleSection(text)];
}

function outlineFromHtml(html: string): DocumentOutlineSection[] {
  const categorySections = outlineFromCategoryMarkers(html);
  if (categorySections.length >= 2) {
    return categorySections;
  }

  const headingPattern = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const matches = [...html.matchAll(headingPattern)];
  if (matches.length === 0) {
    return [singleSection(html)];
  }

  return matches.map((match, index) => {
    const headingIndex = match.index ?? 0;
    const nextIndex = matches[index + 1]?.index ?? html.length;
    const title = stripHtml(match[2] ?? `Section ${index + 1}`);
    const body = html.slice(headingIndex, nextIndex);
    return {
      sectionId: `section-${index + 1}`,
      title,
      text: truncateText(body, OUTLINE_SECTION_CHAR_CAP).text,
    };
  });
}

function outlineFromCategoryMarkers(text: string): DocumentOutlineSection[] {
  const matches = [...text.matchAll(/Category:\s+([A-Z][^<\n]{1,80})/g)];
  if (matches.length < 2) {
    return [];
  }

  const sections: DocumentOutlineSection[] = [];
  const firstIndex = matches[0].index ?? 0;
  if (firstIndex > 0) {
    sections.push({
      sectionId: 'instructions',
      title: 'Instructions',
      text: truncateText(text.slice(0, firstIndex), OUTLINE_SECTION_CHAR_CAP).text,
    });
  }

  matches.forEach((match, index) => {
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? text.length;
    sections.push({
      sectionId: `category-${index + 1}`,
      title: stripHtml(match[1])
        .replace(/["”]+$/, '')
        .trim(),
      text: truncateText(text.slice(start, end), OUTLINE_SECTION_CHAR_CAP).text,
    });
  });

  return sections;
}

function singleSection(text: string): DocumentOutlineSection {
  return {
    sectionId: 'document',
    title: 'Document',
    text: truncateText(text, OUTLINE_SECTION_CHAR_CAP).text,
    untitled: true,
  };
}

// One tag-strip pass leaves unterminated markup such as a trailing '<script', so drop any residual brackets.
function stripHtml(value: string): string {
  return (
    value
      .replace(/<[^>]+>/g, '')
      .replace(/[<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Section'
  );
}
