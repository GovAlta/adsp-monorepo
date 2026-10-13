const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

// Where the entry file name is recorded for the builder-app build. Outside the bundle directory so it is
// not copied into the deployed assets.
const MANIFEST_PATH = path.resolve(__dirname, '../.generated/template-bundle-manifest.json');
const BUNDLE_URL_PREFIX = 'assets/template-bundles/react/';

const config = require(path.resolve(__dirname, '../webpack.template-react-vendors.config.js'));

webpack(config, (error, stats) => {
  if (error) {
    console.error('[builder-app] Failed to build react template vendor bundle.', error);
    process.exit(1);
  }

  const info = stats.toJson({ all: false, warnings: true, errors: true });

  if (stats.hasErrors()) {
    console.error('[builder-app] React template vendor bundle has errors.');
    for (const buildError of info.errors || []) {
      console.error(buildError.message || buildError);
    }
    process.exit(1);
  }

  if (stats.hasWarnings()) {
    console.warn('[builder-app] React template vendor bundle has warnings.');
    for (const warning of info.warnings || []) {
      console.warn(warning.message || warning);
    }
  }

  const entryFile = (stats.toJson({ all: false, assets: true }).assetsByChunkName?.main || []).find((file) =>
    /^vendors\.[0-9a-f]{8}\.js$/.test(file),
  );
  if (!entryFile) {
    console.error('[builder-app] Could not find the content-hashed react vendor bundle entry in the build output.');
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify({ react: `${BUNDLE_URL_PREFIX}${entryFile}` }, null, 2) + '\n');

  const summary = stats.toString({ colors: true, chunks: false, modules: false, entrypoints: false });
  console.log(summary);
});
