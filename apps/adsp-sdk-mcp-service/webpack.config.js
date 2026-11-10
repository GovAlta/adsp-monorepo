const path = require('path');
const { composePlugins, withNx } = require('@nx/webpack');

// The same package Nx's own externals use, resolved from @nx/webpack rather than relying on it being hoisted.
const nodeExternals = require(require.resolve('webpack-node-externals', { paths: [require.resolve('@nx/webpack')] }));

module.exports = composePlugins(withNx(), (config, { context }) => {
  // @abgov/adsp-cli is only a dev dependency at the repo root, so the image's pruned node_modules lacks it: bundle it
  // from source instead of leaving a runtime require. Every other package stays external, as in Nx's default.
  config.externals = [
    nodeExternals({
      modulesDir: path.join(context.root, 'node_modules'),
      allowlist: [/^@abgov\/adsp-cli(\/|$)/],
    }),
  ];
  return config;
});
