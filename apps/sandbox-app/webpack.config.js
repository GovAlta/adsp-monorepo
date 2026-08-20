const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');
const { ProvidePlugin } = require('webpack');
const { aliasReactComponents } = require('../../tools/webpack/react-components-version');

const getReactComponentsPackage = () => {
  const version = process.env.SANDBOX_DESIGN_SYSTEMS_VERSION;
  return version === '1' || version === '1.0' ? '@abgov/react-components-ds1' : '@abgov/react-components';
};

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
    }),
  );

  return aliasReactComponents(config, getReactComponentsPackage());
});
