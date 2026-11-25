const { composePlugins, withNx } = require('@nx/webpack');
const SwaggerJSDocWebpackPlugin = require('swagger-jsdoc-webpack-plugin');
const swaggerDefinition = require('./swagger.config');

module.exports = composePlugins(withNx(), (config) => {
  return {
    ...config,
    plugins: [
      ...config.plugins,
      new SwaggerJSDocWebpackPlugin({
        swaggerDefinition,
        apis: ['apps/sharepoint-service/src/**/*.ts', 'apps/sharepoint-service/src/**/*.swagger.yml'],
      }),
    ],
  };
});
