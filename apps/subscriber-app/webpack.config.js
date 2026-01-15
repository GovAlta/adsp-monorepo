const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');

function withSvgr(svgrOptions = {}) {
  const defaultOptions = {
    svgo: false,
    titleProp: true,
    ref: true,
  };

  const options = { ...defaultOptions, ...svgrOptions };

  return function configure(config) {
    // Remove existing SVG loader if present
    const svgLoaderIdx = config.module.rules.findIndex(
      (rule) => typeof rule === 'object' && typeof rule.test !== 'undefined' && rule.test.toString().includes('svg|')
    );

    if (svgLoaderIdx !== -1) {
      // Expecting to find the withReact() plugin rule for assets.
      // Remove svg from the test
      config.module.rules[svgLoaderIdx].test = /\.(avif|bmp|gif|ico|jpe?g|png|webp)$/;
    }

    // Add SVGR loader
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.(js|ts|md)x?$/,
      use: [
        {
          loader: require.resolve('@svgr/webpack'),
          options,
        },
        {
          loader: require.resolve('file-loader'),
          options: {
            name: '[name].[hash].[ext]',
          },
        },
      ],
    });

    return config;
  };
}

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withReact(), withSvgr(), (config, { options, context }) => {
  // Update the webpack config as needed here.
  // e.g. config.plugins.push(new MyPlugin())
  // For more information on webpack config and Nx see:
  // https://nx.dev/packages/webpack/documents/webpack-config-setup

  return config;
});
