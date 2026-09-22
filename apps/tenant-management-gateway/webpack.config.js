const { composePlugins, withNx } = require('@nx/webpack');
const SwaggerJSDocWebpackPlugin = require('swagger-jsdoc-webpack-plugin');
const swaggerDefinition = require('./swagger.config');

module.exports = composePlugins(withNx(), (config) => {
  config.plugins = [
    ...(config.plugins || []),
    new SwaggerJSDocWebpackPlugin({
      swaggerDefinition,
      apis: [
        'apps/tenant-management-gateway/src/**/*.ts',
        'apps/tenant-management-gateway/src/**/*.swagger.yml',
      ],
    }),
  ];
  return config;
});
