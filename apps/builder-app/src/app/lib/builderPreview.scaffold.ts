// @param {string} serializedFiles - JSON stringified files object with < escaped
// @param {string} serializedEsmDeps - JSON stringified array of ESM dependencies
// @param {string} serializedRouteState - JSON stringified route state with < escaped
export function createPreviewScript(
  serializedFiles: string,
  serializedEsmDeps: string,
  serializedRouteState: string,
): string {
  return `
      const files = ${serializedFiles};
      const moduleCache = {};
      const initialRouteState = ${serializedRouteState};

      // Some generated snippets include Vite React Fast Refresh markers.
      // Provide no-op shims so fallback preview can execute them safely.
      if (typeof globalThis.$RefreshReg$ !== 'function') {
        globalThis.$RefreshReg$ = function() {};
      }
      if (typeof globalThis.$RefreshSig$ !== 'function') {
        globalThis.$RefreshSig$ = function() {
          return function(type) {
            return type;
          };
        };
      }
      globalThis.__vite_plugin_react_preamble_installed__ = true;

      const css = Object.entries(files)
        .filter(([path]) => path.endsWith('.css'))
        .map(([, content]) => content)
        .join('\\n\\n');

      if (css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
      }

      function restoreRouteState() {
        if (!initialRouteState) {
          return;
        }

        try {
          const rawPath = typeof initialRouteState.path === 'string' ? initialRouteState.path : '/';
          const rawHash = typeof initialRouteState.hash === 'string' ? initialRouteState.hash : '';
          const rawQuery = typeof initialRouteState.query === 'string' ? initialRouteState.query : '';

          const loweredPath = String(rawPath || '').toLowerCase();
          const invalidPath =
            !rawPath ||
            loweredPath.includes('srcdoc') ||
            loweredPath.includes('about:') ||
            loweredPath.includes('://') ||
            loweredPath.startsWith('//');
          const normalizedPath = invalidPath ? '/' : rawPath.startsWith('/') ? rawPath : '/' + rawPath;
          const normalizedQuery = rawQuery ? (rawQuery.startsWith('?') ? rawQuery : '?' + rawQuery) : '';
          const preferredHash = rawHash || (normalizedPath !== '/' || normalizedQuery ? '#' + normalizedPath + normalizedQuery : '');

          if (preferredHash && window.location.hash !== preferredHash) {
            window.location.hash = preferredHash;
          }
        } catch {
          // Ignore route restore errors; preview should still render default route.
        }
      }

      function normalizePath(path) {
        return path.replace(/^[/]+/, '').replace(/\\\\/g, '/');
      }

      function dirname(path) {
        const normalized = normalizePath(path);
        const index = normalized.lastIndexOf('/');
        return index >= 0 ? normalized.slice(0, index + 1) : '';
      }

      function resolveCandidate(basePath) {
        const normalized = normalizePath(basePath);
        const candidates = [normalized];

        if (!/[.][a-z0-9]+$/i.test(normalized)) {
          candidates.push(
            normalized + '.ts',
            normalized + '.tsx',
            normalized + '.js',
            normalized + '.jsx',
            normalized + '.json',
            normalized + '/index.ts',
            normalized + '/index.tsx',
            normalized + '/index.js',
            normalized + '/index.jsx'
          );
        }

        return candidates.find((candidate) => Object.prototype.hasOwnProperty.call(files, candidate));
      }

      function resolvePath(fromPath, specifier) {
        if (specifier.startsWith('.')) {
          const from = dirname(fromPath).split('/').filter(Boolean);
          const parts = specifier.split('/');

          for (const part of parts) {
            if (!part || part === '.') {
              continue;
            }

            if (part === '..') {
              from.pop();
            } else {
              from.push(part);
            }
          }

          const resolved = resolveCandidate(from.join('/'));
          if (resolved) {
            return resolved;
          }
        }

        return specifier;
      }

      function inferAssetMimeType(path) {
        const ext = String(path).split('.').pop()?.toLowerCase() || '';
        switch (ext) {
          case 'png':
            return 'image/png';
          case 'jpg':
          case 'jpeg':
            return 'image/jpeg';
          case 'gif':
            return 'image/gif';
          case 'webp':
            return 'image/webp';
          case 'bmp':
            return 'image/bmp';
          case 'ico':
            return 'image/x-icon';
          case 'avif':
            return 'image/avif';
          case 'svg':
            return 'image/svg+xml';
          case 'woff':
            return 'font/woff';
          case 'woff2':
            return 'font/woff2';
          case 'ttf':
            return 'font/ttf';
          case 'otf':
            return 'font/otf';
          case 'eot':
            return 'application/vnd.ms-fontobject';
          case 'mp4':
            return 'video/mp4';
          case 'webm':
            return 'video/webm';
          case 'mp3':
            return 'audio/mpeg';
          case 'wav':
            return 'audio/wav';
          case 'ogg':
            return 'audio/ogg';
          default:
            return 'application/octet-stream';
        }
      }

      function toAssetModuleValue(path, source) {
        if (typeof source !== 'string') {
          return 'about:blank';
        }

        const trimmed = source.trim();
        if (trimmed.startsWith('data:')) {
          return trimmed;
        }

        const mime = inferAssetMimeType(path);
          const base64Candidate = trimmed.replace(/\\s+/g, '');
        const looksBase64 =
          base64Candidate.length > 0 &&
          /^[A-Za-z0-9+/=]+$/.test(base64Candidate) &&
          base64Candidate.length % 4 === 0;

        if (looksBase64) {
          return 'data:' + mime + ';base64,' + base64Candidate;
        }

        if (mime === 'image/svg+xml') {
          return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
        }

        return 'about:blank';
      }

      function ensureExternalStylesheet(href) {
        if (!href || document.querySelector('link[data-builder-fallback="' + href + '"]')) {
          return;
        }

        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', href);
        link.setAttribute('data-builder-fallback', href);
        document.head.appendChild(link);
      }

      function ensureExternalModule(specifier, src) {
        if (!src || window.__builderFallbackModules?.[specifier]) {
          return;
        }

        window.__builderFallbackModules = window.__builderFallbackModules || {};
        window.__builderFallbackModules[specifier] = true;

        // Load ESM side effects (custom element registration) without blocking module evaluation.
        import(src).catch((error) => {
          console.warn('Failed to load fallback external module:', specifier, error);
        });
      }

      function toKebabCase(value) {
        return String(value)
          .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
          .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
          .toLowerCase();
      }

      function externalRequire(specifier) {
        function createRouterFallbackModule() {
          const React = window.React;
          const RouterContext = React.createContext({
            path: '/',
            navigate: function() {},
          });

          function normalizePath(value) {
            const raw = String(value || '/').trim();
            if (!raw) {
              return '/';
            }
            return raw.startsWith('/') ? raw : '/' + raw;
          }

          function readPathFromHash() {
            const hash = typeof window.location.hash === 'string' ? window.location.hash : '';
            const value = hash.replace(/^#/, '');
            return normalizePath(value || '/');
          }

          function BrowserRouter(props) {
            const [path, setPath] = React.useState(readPathFromHash);

            React.useEffect(function() {
              const onHashChange = function() {
                setPath(readPathFromHash());
              };

              window.addEventListener('hashchange', onHashChange);
              return function() {
                window.removeEventListener('hashchange', onHashChange);
              };
            }, []);

            const navigate = React.useCallback(function(to) {
              const target = normalizePath(to);
              if (window.location.hash !== '#' + target) {
                window.location.hash = target;
              }
              setPath(target);
            }, []);

            return React.createElement(
              RouterContext.Provider,
              { value: { path: path, navigate: navigate } },
              props.children
            );
          }

          function MemoryRouter(props) {
            const initial = Array.isArray(props.initialEntries) && props.initialEntries.length > 0
              ? normalizePath(props.initialEntries[0])
              : '/';
            const [path, setPath] = React.useState(initial);
            const navigate = React.useCallback(function(to) {
              setPath(normalizePath(to));
            }, []);

            return React.createElement(
              RouterContext.Provider,
              { value: { path: path, navigate: navigate } },
              props.children
            );
          }

          function Route() {
            return null;
          }

          function Routes(props) {
            const context = React.useContext(RouterContext);
            const children = React.Children.toArray(props.children);
            const current = normalizePath(context.path);

            const matched = children.find(function(child) {
              if (!React.isValidElement(child)) {
                return false;
              }
              const routePath = normalizePath(child.props.path || '/');
              return routePath === current || routePath === '*';
            });

            return matched && React.isValidElement(matched) ? matched.props.element || null : null;
          }

          function Link(props) {
            const context = React.useContext(RouterContext);
            const to = normalizePath(props.to || '/');

            const onClick = function(event) {
              if (typeof props.onClick === 'function') {
                props.onClick(event);
              }
              if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
              }
              event.preventDefault();
              context.navigate(to);
            };

            return React.createElement(
              'a',
              Object.assign({}, props, {
                href: '#' + to,
                onClick: onClick,
              }),
              props.children
            );
          }

          function useNavigate() {
            return React.useContext(RouterContext).navigate;
          }

          function useLocation() {
            const path = React.useContext(RouterContext).path;
            return { pathname: normalizePath(path), search: '', hash: '' };
          }

          return {
            BrowserRouter: BrowserRouter,
            MemoryRouter: MemoryRouter,
            Routes: Routes,
            Route: Route,
            Link: Link,
            NavLink: Link,
            Outlet: function Outlet() { return null; },
            useNavigate: useNavigate,
            useLocation: useLocation,
            createBrowserRouter: function() {
              return {
                navigate: function() {},
                state: { location: { pathname: '/' } },
              };
            },
            createMemoryRouter: function() {
              return {
                navigate: function() {},
                state: { location: { pathname: '/' } },
              };
            },
            RouterProvider: function RouterProvider(props) {
              return props.children || null;
            },
          };
        }

        if (specifier === 'react') {
          return window.React;
        }

        if (specifier === 'react-dom') {
          return window.ReactDOM;
        }

        if (specifier === 'react-dom/client') {
          return { createRoot: window.ReactDOM.createRoot };
        }

        if (specifier === '@abgov/web-components/index.css') {
          ensureExternalStylesheet('https://cdn.jsdelivr.net/npm/@abgov/web-components@1.41.0/index.css');
          ensureExternalStylesheet('https://unpkg.com/@abgov/web-components@1.41.0/index.css');
          return {};
        }

        if (specifier === '@abgov/web-components') {
          ensureExternalModule(specifier, 'https://cdn.jsdelivr.net/npm/@abgov/web-components@1.41.0/index.js');
          return {};
        }

        if (specifier === '@abgov/react-components') {
          ensureExternalStylesheet('https://cdn.jsdelivr.net/npm/@abgov/web-components@1.41.0/index.css');
          ensureExternalStylesheet('https://unpkg.com/@abgov/web-components@1.41.0/index.css');
          ensureExternalModule('@abgov/web-components', 'https://cdn.jsdelivr.net/npm/@abgov/web-components@1.41.0/index.js');

          const createComponentBridge = (name) => {
            const rawName = String(name || 'div');
            const normalizedName = rawName.replace(/^Goab/, '');
            const tag = 'goa-' + toKebabCase(normalizedName);

            return function GoabFallbackBridge(props) {
              const input = props || {};
              const elementRef = window.React.useRef(null);
              const outputProps = {};
              const propertyEntries = [];
              const eventEntries = [];

              for (const [key, value] of Object.entries(input)) {
                if (key === 'children') {
                  continue;
                }

                if (key === 'className') {
                  outputProps.className = value;
                  continue;
                }

                if (key === 'testId') {
                  outputProps['data-testid'] = value;
                  continue;
                }

                if (/^on[A-Z]/.test(key) && typeof value === 'function') {
                  const eventName = key.slice(2).toLowerCase();
                  eventEntries.push([eventName, value]);
                  continue;
                }

                propertyEntries.push([key, value]);

                const attributeName = toKebabCase(key);
                if (typeof value === 'string' || typeof value === 'number') {
                  outputProps[attributeName] = String(value);
                } else if (typeof value === 'boolean') {
                  if (value) {
                    outputProps[attributeName] = '';
                  }
                }
              }

              window.React.useEffect(() => {
                const element = elementRef.current;
                if (!element) {
                  return;
                }

                for (const [key, value] of propertyEntries) {
                  try {
                    element[key] = value;
                  } catch {
                    // Ignore non-writable properties in fallback mode.
                  }

                  // Svelte web components register property setters in all-lowercase
                  // (e.g. backgroundUrl → backgroundurl). Try the lowercase form as well
                  // so props like backgroundUrl reach the correct setter.
                  const lowerKey = key.toLowerCase();
                  if (lowerKey !== key) {
                    try {
                      element[lowerKey] = value;
                    } catch {
                      // Ignore non-writable properties in fallback mode.
                    }
                  }

                  const attributeName = toKebabCase(key);
                  if (typeof value === 'boolean') {
                    if (value) {
                      element.setAttribute(attributeName, '');
                    } else {
                      element.removeAttribute(attributeName);
                    }
                  }
                }

                const listeners = [];
                for (const [eventName, handler] of eventEntries) {
                  try {
                    element.addEventListener(eventName, handler);
                    listeners.push([eventName, handler]);
                  } catch {
                    // Ignore invalid event listeners in fallback mode.
                  }
                }

                return () => {
                  for (const [eventName, handler] of listeners) {
                    try {
                      element.removeEventListener(eventName, handler);
                    } catch {
                      // Ignore invalid listener cleanup in fallback mode.
                    }
                  }
                };
              }, [propertyEntries]);

              outputProps.ref = elementRef;

              return window.React.createElement(tag, outputProps, input.children);
            };
          };

          return new Proxy(
            {},
            {
              get: (_, key) => createComponentBridge(String(key)),
            }
          );
        }

        if (specifier === 'ionicons/dist/loader') {
          return {
            defineCustomElements: () => undefined,
          };
        }

        if (specifier === 'ionicons/loader') {
          return {
            defineCustomElements: () => undefined,
          };
        }

        // Handle esm.sh React peer dependency URLs injected by bundled packages
        if (specifier.startsWith('https://esm.sh/react@') || specifier.startsWith('https://esm.sh/react/') || specifier === 'https://esm.sh/react') {
          return window.React;
        }
        if (specifier.startsWith('https://esm.sh/react-dom@') || specifier.startsWith('https://esm.sh/react-dom/') || specifier === 'https://esm.sh/react-dom') {
          return window.ReactDOM;
        }

        // react sub-path externals (jsx-runtime, jsx-dev-runtime) that bundled packages may import
        if (specifier === 'react/jsx-runtime' || specifier === 'react/jsx-dev-runtime') {
          return window.React;
        }
        if (specifier === 'react-dom/client') {
          return { createRoot: window.ReactDOM.createRoot, hydrateRoot: window.ReactDOM.hydrateRoot };
        }
        if (specifier === 'react-dom/server') {
          return {};
        }

        // Shim react-router: BrowserRouter / createBrowserRouter use history.pushState,
        // which throws a SecurityError in srcDoc iframes (document URL is about:srcdoc).
        // Silently map them to MemoryRouter / createMemoryRouter so routing works without
        // requiring workspace code to know about the preview constraint.
        if (specifier === 'react-router-dom' || specifier === 'react-router') {
          window.__builderRouterFallback = window.__builderRouterFallback || createRouterFallbackModule();
          return window.__builderRouterFallback;
        }

        // Return pre-fetched esm.sh module if available
        if (window._esmCache?.[specifier]) {
          return window._esmCache[specifier].exports;
        }

        // Gracefully stub any remaining CDN URL imports (e.g. transitive esm.sh sub-deps
        // that ?bundle didn't fully inline). Return {} rather than crashing the preview.
        if (specifier.startsWith('https://') || specifier.startsWith('http://')) {
          console.warn('[builder preview] unresolved CDN import stubbed:', specifier);
          return {};
        }

        throw new Error('Unsupported external dependency: ' + specifier);
      }

      async function fetchEsmDep(specifier) {
        if (window._esmCache?.[specifier]) {
          return;
        }
        try {
          // ?bundle inlines all transitive deps so the transformed CJS output only
          // requires 'react' and 'react-dom' (which we handle), not CDN sub-dependency URLs.
          // Also list common React sub-path externals so esm.sh doesn't try to bundle them.
          const response = await fetch(
            'https://esm.sh/' + specifier +
            '?bundle&external=react,react-dom,react/jsx-runtime,react/jsx-dev-runtime,react-dom/client,react-dom/server'
          );
          if (!response.ok) {
            throw new Error('HTTP ' + response.status);
          }
          const esmSource = await response.text();
          // Preprocess import.meta before Babel transform — esbuild bundles often emit
          // import.meta.url / import.meta.env which cause a SyntaxError inside new Function.
          const processedSource = esmSource
            .replace(/\\bimport\\.meta\\.url\\b/g, '""')
            .replace(/\\bimport\\.meta\\.env\\.DEV\\b/g, 'false')
            .replace(/\\bimport\\.meta\\.env\\.PROD\\b/g, 'true')
            .replace(/\\bimport\\.meta\\.env\\b/g, '{}')
            .replace(/\\bimport\\.meta\\.hot\\b/g, 'undefined')
            .replace(/\\bimport\\.meta\\b/g, '{}');
          const transformed = window.Babel.transform(processedSource, {
            presets: [],
            plugins: ['transform-modules-commonjs'],
            sourceType: 'module',
          }).code;
          const mod = { exports: {} };
          new Function('require', 'module', 'exports', transformed)(externalRequire, mod, mod.exports);
          window._esmCache = window._esmCache || {};
          window._esmCache[specifier] = mod;
        } catch (error) {
          console.warn('[builder preview] esm.sh load failed for: ' + specifier, error);
        }
      }

      function loadModule(path) {
        const resolvedPath = normalizePath(path);

        if (moduleCache[resolvedPath]) {
          return moduleCache[resolvedPath].exports;
        }

        if (resolvedPath.endsWith('.json')) {
          return JSON.parse(files[resolvedPath]);
        }

        // Treat common static assets as URL/string modules in fallback mode.
        // Accept data: URLs or base64 payloads when available, otherwise fall
        // back to a blank URL rather than trying to transpile assets as JS.
        if (/[.](png|jpe?g|gif|webp|bmp|ico|avif|svg|ttf|otf|woff2?|eot|mp4|webm|mp3|wav|ogg)$/i.test(resolvedPath)) {
          return toAssetModuleValue(resolvedPath, files[resolvedPath]);
        }

        const source = files[resolvedPath];
        if (typeof source !== 'string') {
          throw new Error('Module not found: ' + resolvedPath);
        }

        if (resolvedPath.endsWith('.css')) {
          if (/[.]module[.]css$/i.test(resolvedPath)) {
            // Fallback preview does not run a CSS Modules transform.
            // Return identity mappings so styles.foo resolves to "foo" and
            // class-based layout styles (e.g. page padding) still apply.
            let identityProxy;
            identityProxy = new Proxy(
              {},
              {
                get: (_, key) => {
                  if (key === '__esModule') {
                    return true;
                  }
                  if (key === 'default') {
                    return identityProxy;
                  }
                  return String(key);
                },
              }
            );
            return identityProxy;
          }
          return {};
        }

        const isTsFile = /[.](ts|tsx)$/i.test(resolvedPath);
        const isJsxFile = /[.](jsx|tsx)$/i.test(resolvedPath);
        const hasReactBinding =
          /import\\s+React\\b/.test(source) ||
          /import\\s+\\*\\s+as\\s+React\\b/.test(source) ||
          /(?:const|let|var)\\s+React\\s*=/.test(source);
        const transpileSource = isJsxFile && !hasReactBinding ? 'const React = require("react");\\n' + source : source;
        const presets = [];

        if (isTsFile) {
          presets.push(['typescript', { allExtensions: true, isTSX: /[.]tsx$/i.test(resolvedPath) }]);
        }

        if (/[.](js|jsx|ts|tsx)$/i.test(resolvedPath)) {
          presets.push(['react', { runtime: 'classic' }]);
        }

        const transformed = window.Babel.transform(transpileSource, {
          filename: resolvedPath,
          presets,
          plugins: ['transform-modules-commonjs'],
          sourceType: 'module',
        }).code;

        const module = { exports: {} };
        moduleCache[resolvedPath] = module;

        const localRequire = (specifier) => {
          if (specifier.startsWith('.')) {
            return loadModule(resolvePath(resolvedPath, specifier));
          }

          return externalRequire(specifier);
        };

        const evaluator = new Function('require', 'module', 'exports', transformed);
        evaluator(localRequire, module, module.exports);
        return module.exports;
      }

      const esmDepsToFetch = ${serializedEsmDeps};

      (async function() {
        try {
          restoreRouteState();

          if (esmDepsToFetch.length > 0) {
            await Promise.all(esmDepsToFetch.map(fetchEsmDep));
          }

          const entryPath = resolveCandidate('src/main') || resolveCandidate('src/index') || resolveCandidate('index');
          if (!entryPath) {
            throw new Error('No preview entry file found. Expected src/main.* or src/index.*');
          }

          document.getElementById('preview-loading')?.remove();
          loadModule(entryPath);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const errorHtml = '<pre style="padding:16px;color:#5c1b14;background:#fff3f0;border:1px solid #f0b8ae;border-radius:12px;font:14px/1.5 monospace;white-space:pre-wrap;">Fallback preview failed: ' + message + '</pre>';
          document.body.innerHTML = errorHtml;
        }
      })();
    `;
}
