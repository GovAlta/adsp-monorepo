const base = require('@nrwl/react/plugins/webpack');

module.exports = (config) => {
  base(config);
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        handlebars: 'handlebars/dist/handlebars.min.js',
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
  };
};
