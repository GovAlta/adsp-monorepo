import { readdirSync, readFileSync } from 'fs';
import { join, relative, sep } from 'path';
import { countTerms, scoreByTermFrequency, tokenize } from '../search/textSearch';

export interface AdspDoc {
  path: string;
  title: string;
  content: string;
}

export interface AdspDocSearchResult {
  path: string;
  title: string;
  snippet: string;
  score: number;
}

/**
 * Non-Node platform SDK docs excluded so results stay focused on the Node SDK covered by this package.
 */
const EXCLUDED_DOC_PATHS = new Set([
  'platform/platform-dotnet-sdk.md',
  'platform/platform-django-sdk.md',
  'platform/platform-flask-sdk.md',
  'platform/platform-spring-sdk.md',
]);

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'is', 'are',
  'how', 'do', 'does', 'i', 'what', 'with', 'from', 'this', 'that', 'it', 'be',
]);

interface IndexedDoc extends AdspDoc {
  titleCounts: Map<string, number>;
  bodyCounts: Map<string, number>;
}

function parseFrontmatter(raw: string): { title?: string; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) {
    return { body: raw };
  }

  const titleMatch = /^title:\s*(.+)$/m.exec(match[1]);
  const title = titleMatch?.[1].trim().replace(/^["']|["']$/g, '');

  return { title, body: raw.slice(match[0].length) };
}

function listMarkdownFiles(dir: string, root = dir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return listMarkdownFiles(fullPath, root);
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      return [relative(root, fullPath).split(sep).join('/')];
    }
    return [];
  });
}

function scoreDoc(doc: IndexedDoc, terms: string[]): number {
  return scoreByTermFrequency(terms, doc.titleCounts) * 5 + scoreByTermFrequency(terms, doc.bodyCounts);
}

function toSearchResult(doc: IndexedDoc, score: number, terms: string[]): AdspDocSearchResult {
  return { path: doc.path, title: doc.title, snippet: buildSnippet(doc.content, terms), score };
}

function buildSnippet(content: string, terms: string[], radius = 160): string {
  const lower = content.toLowerCase();
  const index = terms.reduce((found, term) => (found >= 0 ? found : lower.indexOf(term)), -1);

  if (index < 0) {
    return content.slice(0, radius * 2).replace(/\s+/g, ' ').trim();
  }

  const start = Math.max(0, index - radius);
  const end = Math.min(content.length, index + radius);
  const snippet = content.slice(start, end).replace(/\s+/g, ' ').trim();

  return `${start > 0 ? '…' : ''}${snippet}${end < content.length ? '…' : ''}`;
}

export function loadDocs(docsRoot: string): AdspDoc[] {
  return listMarkdownFiles(docsRoot)
    .filter((path) => !EXCLUDED_DOC_PATHS.has(path))
    .map((path) => {
      const raw = readFileSync(join(docsRoot, path), 'utf8');
      const { title, body } = parseFrontmatter(raw);
      return { path, title: title || path, content: body.trim() };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

export class DocsRepository {
  private readonly docs: IndexedDoc[];

  constructor(docsRoot: string) {
    this.docs = loadDocs(docsRoot).map((doc) => ({
      ...doc,
      titleCounts: countTerms(tokenize(doc.title)),
      bodyCounts: countTerms(tokenize(doc.content)),
    }));
  }

  list(): { path: string; title: string }[] {
    return this.docs.map(({ path, title }) => ({ path, title }));
  }

  read(path: string): AdspDoc | undefined {
    const doc = this.docs.find((d) => d.path === path);
    return doc && { path: doc.path, title: doc.title, content: doc.content };
  }

  search(query: string, limit = 5): AdspDocSearchResult[] {
    const terms = tokenize(query).filter((term) => !STOP_WORDS.has(term));
    if (terms.length === 0) {
      return [];
    }

    return this.docs
      .map((doc) => ({ doc, score: scoreDoc(doc, terms) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ doc, score }) => toSearchResult(doc, score, terms));
  }
}
