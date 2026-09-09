import type { DocumentOutline, DocumentOutlineSection } from '../../../../utils/documentOutline';
import { SOURCE_DOCUMENTS_KEY } from '../../../../types';

const PLANNER_SOURCE_CHAR_CAP = 60_000;
const STEP_SOURCE_CHAR_CAP = 24_000;

interface DocumentContext {
  get(key: string): unknown;
}

export function readSourceDocuments(context: DocumentContext): DocumentOutline[] {
  const documents = context.get(SOURCE_DOCUMENTS_KEY);
  return Array.isArray(documents) ? (documents as DocumentOutline[]) : [];
}

export function sourceCharCount(documents: DocumentOutline[]): number {
  return documents.reduce((total, document) => total + (document.charCount ?? 0), 0);
}

export function sourcePageCount(documents: DocumentOutline[]): number {
  return documents.reduce((total, document) => total + (document.pageCount ?? 0), 0);
}

/** Section text for the whole requirement set, used once by the planner. */
export function plannerSourceText(documents: DocumentOutline[]): string {
  if (!documents.length) {
    return '';
  }

  return capSections(
    documents.flatMap((document) => document.sections.map((section) => formatSection(document.filename, section))),
    PLANNER_SOURCE_CHAR_CAP,
  );
}

/** Verbatim text for one planned step, so field labels keep the document's exact wording. */
export function stepSourceText(documents: DocumentOutline[], sectionId?: string): string {
  if (!documents.length) {
    return '';
  }

  for (const document of documents) {
    const section = document.sections.find((candidate) => candidate.sectionId === sectionId);
    if (section) {
      return formatSection(document.filename, section).slice(0, STEP_SOURCE_CHAR_CAP);
    }
  }

  return capSections(
    documents.flatMap((document) => document.sections.map((section) => formatSection(document.filename, section))),
    STEP_SOURCE_CHAR_CAP,
  );
}

export function describeSections(documents: DocumentOutline[]): string {
  const lines = documents.flatMap((document) =>
    document.sections.map((section) => `- ${section.sectionId}: ${section.title} (${section.text.length} chars)`),
  );

  return lines.join('\n');
}

function formatSection(filename: string, section: DocumentOutlineSection): string {
  return `### ${section.sectionId}: ${section.title} (from '${filename}')\n${section.text}`;
}

function capSections(sections: string[], cap: number): string {
  const kept: string[] = [];
  let used = 0;

  for (const section of sections) {
    if (used + section.length > cap) {
      kept.push(section.slice(0, Math.max(0, cap - used)));
      break;
    }
    kept.push(section);
    used += section.length;
  }

  return kept.join('\n\n');
}
