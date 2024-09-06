const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');
const { ProvidePlugin } = require('webpack');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withReact(), (config) => {
  // Update the webpack config as needed here.
  // e.g. `config.plugins.push(new MyPlugin())`

  // NOTE: workaround for https://github.com/nrwl/nx/issues/21773
  const svgRule = config.module.rules.find((rule) => typeof rule === 'object' && rule.test.toString().includes('svg'));
  if (svgRule) {
    svgRule.use = [
      {
        loader: require.resolve('@svgr/webpack'),
        options: {
          svgo: false,
          titleProp: true,
          ref: true,
        },
      },
      {
        loader: require.resolve('file-loader'),
        options: {
          name: '[name].[hash].[ext]',
        },
      },
    ];
  }

  // This is needed for @apidevtools/json-schema-ref-parser
  config.resolve.fallback = {
    ...config.resolve.fallback,
    path: require.resolve('path-browserify'),
    fs: require.resolve('browserify-fs'),
  };
  config.plugins.push(
    new ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    })
  );

  return config;
});
