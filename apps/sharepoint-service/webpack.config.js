const { composePlugins, withNx } = require('@nx/webpack');
const SwaggerJSDocWebpackPlugin = require('swagger-jsdoc-webpack-plugin'); // clean-code-ignore: RULE-19 — build config; the build runs it, no runtime code to test.
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
