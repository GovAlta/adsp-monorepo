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

          // Set the initial route for PatchedMemoryRouter in the vendor bundle.
          // Must be set before the vendor bundle script tag loads so MemoryRouter
          // reads it during first render.
          window.__BUILDER_INITIAL_ROUTE__ = normalizedPath + normalizedQuery;
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
          presets.push(['typescript', { ignoreExtensions: false }]);
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

      // Capture runtime errors and unhandled rejections that occur during user
      // interaction (after initial render). Shows a pinned banner in the preview
      // and posts the error to the parent frame so the builder can automatically
      // include it in the next message sent to the agent.
      function showPreviewErrorBanner(message, stack) {
        var existing = document.getElementById('__preview-error-banner__');
        if (existing) existing.remove();
        var banner = document.createElement('div');
        banner.id = '__preview-error-banner__';
        banner.setAttribute('style', 'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#fff3f0;border-bottom:3px solid #c42c2c;padding:10px 40px 10px 14px;font:13px/1.5 monospace;color:#5c1b14;');
        var label = document.createElement('span');
        label.innerHTML = '<strong>Preview error</strong> — ';
        banner.appendChild(label);
        var msg = document.createTextNode(String(message));
        banner.appendChild(msg);
        if (stack) {
          var pre = document.createElement('pre');
          pre.setAttribute('style', 'margin:4px 0 0;font-size:11px;opacity:0.75;white-space:pre-wrap;');
          pre.textContent = stack.split('\\n').slice(0, 5).join('\\n');
          banner.appendChild(pre);
        }
        var close = document.createElement('button');
        close.setAttribute('style', 'position:absolute;top:8px;right:10px;background:none;border:none;cursor:pointer;font-size:16px;color:#5c1b14;line-height:1;');
        close.setAttribute('aria-label', 'Dismiss');
        close.textContent = '×';
        close.addEventListener('click', function() { banner.remove(); });
        banner.appendChild(close);
        document.body.appendChild(banner);
      }

      function reportPreviewError(message, stack) {
        showPreviewErrorBanner(message, stack);
        try { window.parent.postMessage({ type: 'preview-error', message: message, stack: stack || '' }, '*'); } catch (_) {}
      }

      window.addEventListener('error', function(e) {
        reportPreviewError(e.message || String(e.error), e.error && e.error.stack ? e.error.stack : '');
      });

      window.addEventListener('unhandledrejection', function(e) {
        var msg = e.reason instanceof Error ? e.reason.message : String(e.reason || 'Unhandled promise rejection');
        var stack = e.reason instanceof Error ? (e.reason.stack || '') : '';
        reportPreviewError(msg, stack);
      });

      // Prevent plain anchor links (e.g. GoabAppHeader url="/") from navigating
      // the iframe to the builder app URL. Runs in bubble phase so React Router
      // <Link> clicks are handled first — React Router calls e.preventDefault()
      // before the event reaches document, so e.defaultPrevented is true by the
      // time our handler runs and we skip those. Shadow DOM links (GoAB web
      // components) never reach React Router, so we catch them here via
      // composedPath() which exposes the full path including shadow DOM elements.
      document.addEventListener('click', function(e) {
        if (e.defaultPrevented) { return; }
        var path = e.composedPath ? e.composedPath() : [];
        var anchor = null;
        for (var i = 0; i < path.length; i++) {
          if (path[i].tagName === 'A') { anchor = path[i]; break; }
        }
        if (!anchor) { return; }
        var href = anchor.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          e.preventDefault();
          // Resolve the href to a router path and let the app navigate internally.
          // e.g. url="/" on GoabAppHeader should take the user to the home route.
          try {
            var routePath = new URL(href, 'http://localhost').pathname || '/';
            window.dispatchEvent(new CustomEvent('preview:navigate', { detail: routePath }));
          } catch (_) {}
        }
      });

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
