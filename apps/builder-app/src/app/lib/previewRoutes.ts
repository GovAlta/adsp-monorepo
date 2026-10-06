import { type ChatCommand } from '@core-services/app-common';
import { type WorkspaceFileMap } from './builderWorkspace';

const ROUTE_PATH_PATTERN = /<Route\b[^>]*?\bpath\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["'`]([^"'`]*)["'`]\s*\})/g;

function normalizeRoutePath(path: string): string {
  const trimmed = path.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  return `/${trimmed}`;
}

/**
 * Extracts the route paths declared with `<Route path="...">` in the workspace source files.
 * Wildcard (`*`) routes are skipped since they are not navigable destinations.
 */
export function extractPreviewRoutes(files: WorkspaceFileMap): string[] {
  const routes = new Set<string>();

  Object.entries(files).forEach(([filePath, content]) => {
    if (typeof content !== 'string' || !/\.(jsx?|tsx?)$/i.test(filePath) || !content.includes('<Route')) {
      return;
    }

    for (const match of content.matchAll(ROUTE_PATH_PATTERN)) {
      const path = match[1] ?? match[2] ?? match[3];
      if (path !== undefined && !path.includes('*')) {
        routes.add(normalizeRoutePath(path));
      }
    }
  });

  return Array.from(routes).sort((a, b) => a.localeCompare(b));
}

function matchesPattern(pattern: string, path: string): boolean {
  const patternSegments = pattern.split('/');
  const pathSegments = path.split('/');

  return (
    patternSegments.length === pathSegments.length &&
    patternSegments.every((segment, index) => segment.startsWith(':') || segment === pathSegments[index])
  );
}

/**
 * Resolves user input to a navigable route. Accepts the full path (`/apply`), a bare name (`apply`),
 * or a concrete path for a parameterized route (`/items/5` for `/items/:id`). Returns the resolved
 * path including any query string, or null when no route matches unambiguously.
 */
export function resolvePreviewRoute(input: string, routes: string[]): string | null {
  const [rawPath, ...queryParts] = input.trim().split('?');
  const query = queryParts.length ? `?${queryParts.join('?')}` : '';
  const target = normalizeRoutePath(rawPath).toLowerCase();

  const exact = routes.find((route) => route.toLowerCase() === target);
  if (exact) {
    return `${exact}${query}`;
  }

  const parameterized = routes.filter((route) => route.includes(':') && matchesPattern(route.toLowerCase(), target));
  if (parameterized.length === 1) {
    return `${target}${query}`;
  }

  // Fall back to a unique route ending with the typed segment(s), e.g. "apply" for "/forms/apply".
  const suffixMatches = routes.filter((route) => !route.includes(':') && route.toLowerCase().endsWith(target));
  return suffixMatches.length === 1 ? `${suffixMatches[0]}${query}` : null;
}

export type PreviewCommand = { name: 'go'; argument: string } | { name: 'routes' };

/**
 * Parses the chat slash commands handled locally by the builder rather than sent to the agent.
 * Returns null for any other text, including other messages that happen to start with a slash.
 */
export function parsePreviewCommand(text: string): PreviewCommand | null {
  const match = /^\/(go|routes)(?:\s+(.*))?$/is.exec(text.trim());
  if (!match) {
    return null;
  }

  return match[1].toLowerCase() === 'go' ? { name: 'go', argument: (match[2] ?? '').trim() } : { name: 'routes' };
}

export const PREVIEW_COMMANDS: ChatCommand[] = [
  { name: 'go', usage: '/go <route>', description: 'Navigate the preview to a route' },
  { name: 'routes', description: 'List the routes in the preview app' },
];
