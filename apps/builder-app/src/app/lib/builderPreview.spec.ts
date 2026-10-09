/** @jest-environment jsdom */
import { type WorkspaceFileMap } from './builderWorkspace';

jest.mock('./builderPreview.scaffold.html', () => ({
  __esModule: true,
  default: '<html><body><script id="builder-preview-script"></script></body></html>',
}));
jest.mock('./builderPreview.empty.html', () => ({ __esModule: true, default: '<html>empty</html>' }));

const files: WorkspaceFileMap = {
  'package.json': JSON.stringify({ previewTemplateId: 'react' }),
  'src/main.tsx': 'export default 1;',
};

function loadCreateFallbackPreviewDocument() {
  let createFallbackPreviewDocument!: typeof import('./builderPreview').createFallbackPreviewDocument;
  jest.isolateModules(() => {
    createFallbackPreviewDocument = require('./builderPreview').createFallbackPreviewDocument;
  });
  return createFallbackPreviewDocument;
}

describe('createFallbackPreviewDocument vendor bundle', () => {
  afterEach(() => {
    delete (globalThis as { __TEMPLATE_VENDOR_BUNDLES__?: unknown }).__TEMPLATE_VENDOR_BUNDLES__;
  });

  it('uses the content-hashed bundle path injected at build time', () => {
    (globalThis as { __TEMPLATE_VENDOR_BUNDLES__?: unknown }).__TEMPLATE_VENDOR_BUNDLES__ = {
      react: 'assets/template-bundles/react/vendors.9b56f2d7.js',
    };

    const document = loadCreateFallbackPreviewDocument()(files);

    expect(document).toContain(`${window.location.origin}/assets/template-bundles/react/vendors.9b56f2d7.js`);
    expect(document).not.toContain('react/vendors.js');
  });

  it('falls back to the unhashed bundle path when no build-time value is injected', () => {
    const document = loadCreateFallbackPreviewDocument()(files);

    expect(document).toContain(`${window.location.origin}/assets/template-bundles/react/vendors.js`);
  });

  it('reports an unsupported template when the template id has no bundle', () => {
    const document = loadCreateFallbackPreviewDocument()({
      ...files,
      'package.json': JSON.stringify({ previewTemplateId: 'unknown' }),
    });

    expect(document).toContain('Preview is not supported for this template');
  });
});
