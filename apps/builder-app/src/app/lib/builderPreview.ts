import emptyStateHtml from './builderPreview.empty.html';
import scaffoldHtml from './builderPreview.scaffold.html';
import { createPreviewScript } from './builderPreview.scaffold';
import { type WorkspaceFileMap } from './builderWorkspace';

export interface PreviewRouteState {
  path: string;
  hash: string;
  query: string;
}

const KNOWN_PREVIEW_SPECIFIERS = new Set([
  'react',
  'react-dom',
  'react-dom/client',
  'react-router-dom',
  'react-router',
  '@abgov/web-components',
  '@abgov/web-components/index.css',
  '@abgov/react-components',
  'ionicons/dist/loader',
]);

const NODE_BUILTIN_PREFIXES = new Set([
  'node:',
  'fs',
  'path',
  'os',
  'url',
  'util',
  'stream',
  'crypto',
  'zlib',
  'events',
  'buffer',
  'assert',
  'http',
  'https',
  'net',
  'tls',
  'child_process',
  'worker_threads',
]);

function isNodeBuiltin(specifier: string): boolean {
  if (specifier.startsWith('node:')) {
    return true;
  }

  const root = specifier.split('/')[0];
  return NODE_BUILTIN_PREFIXES.has(specifier) || NODE_BUILTIN_PREFIXES.has(root);
}

function scanPackageRuntimeDeps(files: WorkspaceFileMap): string[] {
  const packagePaths = Object.keys(files)
    .filter((path) => /(?:^|\/)package\.json$/.test(path))
    .filter((path) => !/node_modules\//.test(path))
    .sort((left, right) => left.length - right.length);

  if (packagePaths.length === 0) {
    return [];
  }

  const preferredPath = packagePaths.find((path) => path === 'package.json') || packagePaths[0];
  const source = files[preferredPath];
  if (typeof source !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(source) as {
      dependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
    };

    const names = new Set<string>([
      ...Object.keys(parsed.dependencies || {}),
      ...Object.keys(parsed.optionalDependencies || {}),
    ]);

    return [...names].filter((name) => !!name && !KNOWN_PREVIEW_SPECIFIERS.has(name) && !isNodeBuiltin(name));
  } catch {
    return [];
  }
}

function scanExternalDeps(files: WorkspaceFileMap): string[] {
  const deps = new Set<string>();
  const patternSources = [
    /(?:import|export)[^'"]*from\s+['"]([^'"]+)['"]/.source,
    /\bimport\s+['"]([^'"]+)['"]/.source,
    /\brequire\s*\(\s*['"]([^'"]+)['"]/.source,
  ];

  for (const [path, source] of Object.entries(files)) {
    if (typeof source !== 'string') {
      continue;
    }
    // Skip config/build-tool files — they import packages that don't run in the browser
    if (/(?:^|\/)(?:vite|webpack|babel|jest|rollup|eslint|prettier|postcss|tailwind)\.config\.[a-z]+$/.test(path)) {
      continue;
    }
    for (const patternSource of patternSources) {
      const re = new RegExp(patternSource, 'g');
      let match: RegExpExecArray | null;
      while ((match = re.exec(source)) !== null) {
        const specifier = match[1];
        if (
          specifier &&
          !specifier.startsWith('.') &&
          !specifier.startsWith('/') &&
          !KNOWN_PREVIEW_SPECIFIERS.has(specifier) &&
          !isNodeBuiltin(specifier)
        ) {
          deps.add(specifier);
        }
      }
    }
  }

  return [...deps];
}

export function createFallbackPreviewDocument(files: WorkspaceFileMap, routeState?: PreviewRouteState): string {
  // Show empty state hint if no files
  if (Object.keys(files).length === 0) {
    return emptyStateHtml;
  }

  const serializedFiles = JSON.stringify(files).replace(/</g, '\\u003c');
  const serializedEsmDeps = JSON.stringify([
    ...new Set([...scanPackageRuntimeDeps(files), ...scanExternalDeps(files)]),
  ]);
  const serializedRouteState = JSON.stringify(routeState ?? null).replace(/</g, '\\u003c');

  const scriptContent = createPreviewScript(serializedFiles, serializedEsmDeps, serializedRouteState);

  return scaffoldHtml.replace('<script id="builder-preview-script"></script>', `<script>${scriptContent}</script>`);
}
