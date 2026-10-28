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
    }),
  );

  // Benign browser warning triggered by FullCalendar's height changes; don't show it in the dev overlay.
  if (config.devServer) {
    const overlay = config.devServer.client?.overlay;
    config.devServer.client = {
      ...config.devServer.client,
      overlay: {
        ...(typeof overlay === 'object' ? overlay : { errors: overlay !== false, warnings: false }),
        runtimeErrors: (error) => !/ResizeObserver loop/.test(error?.message ?? ''),
      },
    };
  }

  return aliasReactComponents(config, '@abgov/react-components', {
    ds1Package: '@abgov/react-components',
  });
});
