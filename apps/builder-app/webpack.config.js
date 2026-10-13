const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');
const TerserPlugin = require('terser-webpack-plugin');

// The template vendor bundles have content-hashed names (see build-template-react-vendors.js). Read the
// manifest the vendor build writes so the preview can reference the current file. The build target depends on
// the vendor build, so the manifest exists whenever this config is used to build or serve.
function readTemplateVendorBundles() {
  const manifestPath = path.resolve(__dirname, '.generated/template-bundle-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Template vendor bundle manifest not found at ${manifestPath}. Run: npx nx run builder-app:build-react-template-vendors`,
    );
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

// Nx plugins for webpack.
module.exports = composePlugins(
  withNx(),
  withReact({
    // Uncomment this line if you don't want to use SVGR
    // See: https://react-svgr.com/
    // svgr: false
  }),
  (config) => {
    // Update the webpack config as needed here.
    // e.g. `config.plugins.push(new MyPlugin())`
    config.module.rules.push({
      test: /builderPreview\..*[.]html$/i,
      type: 'asset/source',
    });
    config.output.clean = true;

    config.plugins.push(
      new webpack.DefinePlugin({
        __TEMPLATE_VENDOR_BUNDLES__: JSON.stringify(readTemplateVendorBundles()),
      }),
    );

    // Exclude pre-built template vendor bundle assets from terser minification.
    // These are already optimised by their own build and may use syntax the
    // root workspace terser version does not support.
    if (config.optimization?.minimizer) {
      config.optimization.minimizer = config.optimization.minimizer.map((minimizer) => {
        if (minimizer instanceof TerserPlugin || minimizer?.constructor?.name === 'TerserPlugin') {
          return new TerserPlugin({
            exclude: /assets[\\/]template-bundles/,
          });
        }
        return minimizer;
      });
    }

    return config;
  },
);
