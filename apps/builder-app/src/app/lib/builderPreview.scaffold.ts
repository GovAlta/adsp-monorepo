// @param {string} serializedFiles - JSON stringified files object with < escaped
// @param {string} serializedRouteState - JSON stringified route state with < escaped
// @param {string} vendorBundleUrl - absolute URL of pre-built template vendor bundle
export function createPreviewScript(
  serializedFiles: string,
  serializedRouteState: string,
  vendorBundleUrl: string,
): string {
  return `
      const files = ${serializedFiles};
      const moduleCache = {};
      const initialRouteState = ${serializedRouteState};

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

      function externalRequire(specifier) {
        // 1. Template vendor bundle — version-locked, pre-built, primary path.
        const templateDeps = window.__BUILDER_TEMPLATE_DEPS__;
        if (templateDeps && Object.prototype.hasOwnProperty.call(templateDeps, specifier)) {
          const dep = templateDeps[specifier];

          // In srcdoc previews, react-router URL construction can throw because
          // window.location is about:srcdoc. Use MemoryRouter in preview only.
          if (specifier === 'react-router-dom' && dep && dep.MemoryRouter) {
            return {
              ...dep,
              BrowserRouter: dep.MemoryRouter,
              HashRouter: dep.MemoryRouter,
            };
          }

          return dep;
        }

        // 2. CSS side-effect imports on external packages → passthrough.
        if (typeof specifier === 'string' && specifier.endsWith('.css')) {
          return {};
        }

        // 3. esm.sh fallback cache for packages not in the vendor bundle.
        if (window._esmCache?.[specifier]) {
          return window._esmCache[specifier].exports;
        }

        // 4. Warn and stub anything else so a missing dep doesn't crash the full preview.
        console.warn('[builder preview] unresolved dependency stubbed:', specifier);
        return {};
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

      const vendorBundleUrl = ${JSON.stringify(vendorBundleUrl)};

      (async function() {
        try {
          restoreRouteState();

          // Load pre-built template vendor bundle.
          // Populates window.__BUILDER_TEMPLATE_DEPS__ with all template dependencies
          // so externalRequire can resolve them synchronously during module evaluation.
          await new Promise(function(resolve, reject) {
            const script = document.createElement('script');
            script.src = vendorBundleUrl;
            script.onload = resolve;
            script.onerror = function() { reject(new Error('Failed to load vendor bundle: ' + vendorBundleUrl)); };
            document.head.appendChild(script);
          });

          const entryPath = resolveCandidate('src/main') || resolveCandidate('src/index') || resolveCandidate('index');
          if (!entryPath) {
            throw new Error('No preview entry file found. Expected src/main.* or src/index.*');
          }

          document.getElementById('preview-loading')?.remove();
          loadModule(entryPath);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const errorHtml = '<pre style="padding:16px;color:#5c1b14;background:#fff3f0;border:1px solid #f0b8ae;border-radius:12px;font:14px/1.5 monospace;white-space:pre-wrap;">Preview failed: ' + message + '</pre>';
          document.body.innerHTML = errorHtml;
        }
      })();
    `;
}
