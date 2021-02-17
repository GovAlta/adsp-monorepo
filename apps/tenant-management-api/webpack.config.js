const SwaggerJSDocWebpackPlugin = require('swagger-jsdoc-webpack-plugin');
const swaggerDefinition = require('./swagger.config');
const Dotenv = require('dotenv-webpack');

module.exports = (config) => {
  return {
    ...config,
    plugins: [
      ...config.plugins,
      new SwaggerJSDocWebpackPlugin({
        swaggerDefinition,
        apis: ['apps/tenant-management-api/src/app/**/*.ts'],
      }),
    ],
  };
};
