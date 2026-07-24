const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');
const { ProvidePlugin } = require('webpack');
const { aliasReactComponents } = require('../../tools/webpack/react-components-version');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withReact(), (config) => {
  // Update the webpack config as needed here.
  // e.g. `config.plugins.push(new MyPlugin())`

  // This is needed for @apidevtools/json-schema-ref-parser
  config.resolve.fallback = {
    ...config.resolve.fallback,
    path: require.resolve('path-browserify'),
    fs: false,
  };
  config.plugins.push(
    new ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    })
  );

  return aliasReactComponents(config, '@abgov/react-components-ds1', {
    webComponentsPackage: '@abgov/web-components-ds1',
    designTokensPackage: '@abgov/design-tokens-ds1',
  });
});
