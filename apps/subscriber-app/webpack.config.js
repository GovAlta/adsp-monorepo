const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withReact(), (config, { options, context }) => {
  // Update the webpack config as needed here.
  // e.g. config.plugins.push(new MyPlugin())
  // For more information on webpack config and Nx see:
  // https://nx.dev/packages/webpack/documents/webpack-config-setup

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

  return config;
});
