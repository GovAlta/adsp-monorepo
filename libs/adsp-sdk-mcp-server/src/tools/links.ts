import { posix } from 'path';
import { ApiServiceSummary } from '../api-specs/apiSpecsRepository';
import { DocsRepository } from '../docs/docsRepository';
import { SdkSymbolDoc } from '../sdk-reference/reference';

export interface Related {
  docs?: string[];
  sdkSymbols?: string[];
  serviceApis?: string[];
}

export interface LinkIndex {
  relatedForDoc(path: string): Related;
  relatedForSymbol(name: string): Related;
  docsForService(app: string): string[];
  hasDoc(path: string): boolean;
  hasServiceApi(app: string): boolean;
}

export interface LinkSources {
  docs: DocsRepository;
  sdkSymbols: SdkSymbolDoc[];
  apiServices: () => ApiServiceSummary[];
}

export const RELATED_CAP = 3;

const MIN_SYMBOL_NAME_LENGTH = 6;
const MARKDOWN_LINK = /\]\(([^)\s]+)/g;
const SITE_LINK = /^\/adsp-monorepo\/(.+)\.html$/;
const SERVICE_PAGE = /^services\/(.+)\.md$/;
// tenant-management-api implements the tenant-service page's service.
const SERVICE_PAGE_APIS: Record<string, string> = { 'tenant-service': 'tenant-management-api' };

function resolveLink(fromPath: string, target: string): string | undefined {
  const withoutAnchor = target.split('#')[0];
  if (!withoutAnchor || /^[a-z][a-z0-9+.-]*:/i.test(withoutAnchor)) {
    return undefined;
  }
  const site = SITE_LINK.exec(withoutAnchor);
  if (site) {
    return `${site[1]}.md`;
  }
  return posix.normalize(posix.join(posix.dirname(fromPath), withoutAnchor));
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function capped(related: Related): Related {
  return Object.fromEntries(
    Object.entries(related)
      .filter(([, values]) => values.length > 0)
      .map(([kind, values]) => [kind, values.slice(0, RELATED_CAP)]),
  );
}

interface Maps {
  docPaths: Set<string>;
  apiApps: Set<string>;
  docRelated: Map<string, Related>;
  symbolRelated: Map<string, Related>;
  serviceDocs: Map<string, string[]>;
}

export function buildLinkIndex({ docs, sdkSymbols, apiServices }: LinkSources): LinkIndex {
  let maps: Maps | undefined;

  const build = (): Maps => {
    const docPaths = new Set(docs.list().map(({ path }) => path));
    const apiApps = new Set(apiServices().map(({ app }) => app));
    const symbolNames = sdkSymbols.filter(({ name }) => name.length >= MIN_SYMBOL_NAME_LENGTH).map(({ name }) => name);
    const symbolPatterns = symbolNames.map((name) => ({
      name,
      pattern: new RegExp(`(?<![\\w$])${escapeRegExp(name)}(?![\\w$])`),
    }));
    const knownSymbols = new Set(sdkSymbols.map(({ name }) => name));

    const docRelated = new Map<string, Related>();
    const serviceDocs = new Map<string, string[]>();
    const docsNamingSymbol = new Map<string, string[]>();

    for (const { path } of docs.list()) {
      const content = docs.read(path)?.content ?? '';

      const linked = [...content.matchAll(MARKDOWN_LINK)]
        .map(([, target]) => resolveLink(path, target))
        .filter((resolved): resolved is string => !!resolved && resolved !== path && docPaths.has(resolved));

      const named = symbolPatterns
        .map(({ name, pattern }) => ({ name, index: content.search(pattern) }))
        .filter(({ index }) => index >= 0)
        .sort((a, b) => a.index - b.index)
        .map(({ name }) => name);
      for (const name of named) {
        docsNamingSymbol.set(name, [...(docsNamingSymbol.get(name) ?? []), path]);
      }

      const page = SERVICE_PAGE.exec(path)?.[1];
      const serviceApi = page && (SERVICE_PAGE_APIS[page] ?? page);
      const serviceApis = serviceApi && apiApps.has(serviceApi) ? [serviceApi] : [];
      for (const app of serviceApis) {
        serviceDocs.set(app, [...(serviceDocs.get(app) ?? []), path]);
      }

      docRelated.set(path, capped({ docs: [...new Set(linked)], sdkSymbols: named, serviceApis }));
    }

    const symbolRelated = new Map(
      sdkSymbols.map(({ name, seeAlso = [] }) => [
        name,
        capped({
          sdkSymbols: seeAlso.filter((other) => other !== name && knownSymbols.has(other)),
          docs: docsNamingSymbol.get(name) ?? [],
        }),
      ]),
    );

    return { docPaths, apiApps, docRelated, symbolRelated, serviceDocs };
  };

  const get = (): Maps => (maps ??= build());

  return {
    relatedForDoc: (path) => get().docRelated.get(path) ?? {},
    relatedForSymbol: (name) => get().symbolRelated.get(name) ?? {},
    docsForService: (app) => (get().serviceDocs.get(app) ?? []).slice(0, RELATED_CAP),
    hasDoc: (path) => get().docPaths.has(path),
    hasServiceApi: (app) => get().apiApps.has(app),
  };
}
