const SwaggerJSDocWebpackPlugin = require('swagger-jsdoc-webpack-plugin');
const swaggerDefinition = require('./swagger.config');

module.exports = (config) => {
  return {
    ...config,
    plugins: [
      ...config.plugins,
      new SwaggerJSDocWebpackPlugin({
        swaggerDefinition,
        apis: ['apps/tenant-management-api/src/**/*.ts', 'apps/tenant-management-api/src/**/*.swagger.yml'],
      }),
    ],
  };
};
