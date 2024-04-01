const { composePlugins, withNx, withWeb } = require('@nx/webpack');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withWeb(), (config) => {
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

  config.output.library = {
    name: 'adspFeedback',
    type: 'var',
    export: ['default', 'adspFeedback'],
  };

  return config;
});
