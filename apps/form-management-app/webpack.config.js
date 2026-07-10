const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');
const { aliasReactComponents } = require('../../tools/webpack/react-components-version');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withReact(), (config, { options, context }) => {
  // Note: This was added by an Nx migration.
  // You should consider inlining the logic into this file.
  // For more information on webpack config and Nx see:
  // https://nx.dev/packages/webpack/documents/webpack-config-setup

  config.ignoreWarnings = [/Failed to parse source map/];

  return aliasReactComponents(require('./webpack.config.old.js')(config, context), '@abgov/react-components');
});
