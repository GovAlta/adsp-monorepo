jest.mock('@abgov/adsp-cli', () => {
  throw new Error('@abgov/adsp-cli was loaded from the package entry point');
});

describe('package entry point', () => {
  // agent-service bundles this entry point, and its image doesn't ship @abgov/adsp-cli: anything reaching the live
  // tools from here would crash it at startup. The hosted server lives at @abgov/adsp-sdk-mcp-server/hosted instead.
  it('loads without @abgov/adsp-cli', () => {
    jest.isolateModules(() => {
      expect(() => require('./index')).not.toThrow();
    });
  });

  it('still exports the docs and SDK reference helpers', () => {
    jest.isolateModules(() => {
      const entry = require('./index');
      expect(Object.keys(entry).sort()).toEqual(['ApiSpecsRepository', 'DocsRepository', 'SDK_REFERENCE', 'loadDocs', 'searchSdkReference']);
    });
  });
});
