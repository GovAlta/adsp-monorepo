const SwaggerJSDocWebpackPlugin = require('swagger-jsdoc-webpack-plugin');
const swaggerDefinition = require('./swagger.config');

module.exports = (config) => {
  return {
    ...config,
    plugins: [
      ...config.plugins,
      new SwaggerJSDocWebpackPlugin({
        swaggerDefinition,
        apis: [
          'apps/client-secret-rotation-api/src/**/*.ts',
          'apps/client-secret-rotation-api/src/**/*.swagger.yml',
        ],
      }),
    ],
  };
};
