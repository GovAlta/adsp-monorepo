import emptyStateHtml from './builderPreview.empty.html';
import scaffoldHtml from './builderPreview.scaffold.html';
import { createPreviewScript } from './builderPreview.scaffold';
import { type WorkspaceFileMap } from './builderWorkspace';

// Maps previewTemplateId values to their vendor bundle asset paths.
const TEMPLATE_VENDOR_BUNDLES: Record<string, string> = {
  react: 'assets/template-bundles/react/vendors.js',
};

function detectVendorBundleUrl(files: WorkspaceFileMap): string | null {
  const pkgContent = files['package.json'];
  if (typeof pkgContent !== 'string') {
    return null;
  }
  try {
    const pkg = JSON.parse(pkgContent) as { previewTemplateId?: string };
    const bundlePath = pkg.previewTemplateId && TEMPLATE_VENDOR_BUNDLES[pkg.previewTemplateId];
    if (bundlePath) {
      return `${window.location.origin}/${bundlePath}`;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

export interface PreviewRouteState {
  path: string;
  hash: string;
  query: string;
}

export function createFallbackPreviewDocument(files: WorkspaceFileMap, routeState?: PreviewRouteState): string {
  if (Object.keys(files).length === 0) {
    return emptyStateHtml;
  }

  const vendorBundleUrl = detectVendorBundleUrl(files);
  if (!vendorBundleUrl) {
    return scaffoldHtml.replace(
      '<script id="builder-preview-script"></script>',
      `<script>document.body.innerHTML = '<pre style="padding:16px;color:#5c1b14;background:#fff3f0;border:1px solid #f0b8ae;border-radius:12px;font:14px/1.5 monospace;">Preview is not supported for this template. Ensure package.json includes a valid previewTemplateId.</pre>';</script>`,
    );
  }

  const serializedFiles = JSON.stringify(files).replace(/</g, '\\u003c');
  const serializedRouteState = JSON.stringify(routeState ?? null).replace(/</g, '\\u003c');

  const scriptContent = createPreviewScript(serializedFiles, serializedRouteState, vendorBundleUrl);

  return scaffoldHtml.replace('<script id="builder-preview-script"></script>', `<script>${scriptContent}</script>`);
}
