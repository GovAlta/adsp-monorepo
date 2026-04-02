const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');
const TerserPlugin = require('terser-webpack-plugin');

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
