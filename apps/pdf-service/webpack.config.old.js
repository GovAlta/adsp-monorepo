const SwaggerJSDocWebpackPlugin = require('swagger-jsdoc-webpack-plugin');
const swaggerDefinition = require('./swagger.config');

module.exports = (config) => {
  return {
    ...config,
    plugins: [
      ...config.plugins,
      new SwaggerJSDocWebpackPlugin({
        swaggerDefinition,
        apis: ['apps/pdf-service/src/**/*.ts', 'apps/pdf-service/src/**/*.swagger.yml'],
      }),
    ],
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
