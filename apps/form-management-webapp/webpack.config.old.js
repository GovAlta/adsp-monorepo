const { ProvidePlugin } = require('webpack');

// Node polyfills needed for @apidevtools/json-schema-ref-parser

module.exports = (config) => {
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        handlebars: 'handlebars/dist/handlebars.min.js',
      },
      fallback: {
        ...config.resolve.fallback,
        path: require.resolve('path-browserify'),
        fs: false,
      },
    },
    module: {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.hbs/,
          type: 'asset/source',
        },
      ],
    },
    plugins: [
      ...config.plugins,
      new ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
  };
};
