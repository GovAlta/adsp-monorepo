const { composePlugins, withNx } = require('@nx/webpack');
const SwaggerJSDocWebpackPlugin = require('swagger-jsdoc-webpack-plugin');
const swaggerDefinition = require('./swagger.config');

// Nx plugins for webpack.
module.exports = composePlugins(
  withNx({
    target: 'node',
  }),
  (config) => {
    config.output = {
      ...config.output,
      ...(process.env.NODE_ENV !== 'production' && {
        clean: true,
        devtoolModuleFilenameTemplate: '[absolute-resource-path]',
      }),
    };
    config.devtool = 'source-map';
    // Update the webpack config as needed here.
    // e.g. `config.plugins.push(new MyPlugin())`
    
    config.plugins = [
      ...config.plugins,
      new SwaggerJSDocWebpackPlugin({
        swaggerDefinition,
        apis: [
          'samples/chat-service/src/**/*.ts',
          'samples/chat-service/src/**/*.swagger.yml',
        ],
      }),
    ];
    
    return config;
  },
);
