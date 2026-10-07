const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const commonConfig = require('./webpack.common.js');

const templateRoot = __dirname;
const templateNodeModules = path.join(templateRoot, 'node_modules');

module.exports = {
  ...commonConfig,
  mode: 'development',
  devtool: 'eval-source-map',
  entry: path.join(templateRoot, 'src/main.tsx'),
  output: {
    path: path.resolve(templateRoot, 'dist'),
    filename: '[name].[contenthash:8].js',
    clean: true,
    publicPath: '/',
  },
  plugins: [
    ...(commonConfig.plugins || []),
    new HtmlWebpackPlugin({
      template: path.join(templateRoot, 'index.html'),
    }),
    // Ionicons fetches icon SVGs at runtime from <resourcesUrl>/svg/<name>.svg
    // (used by goa-icon for any type without a built-in inline icon).
    new CopyWebpackPlugin({
      patterns: [{ from: path.join(templateNodeModules, 'ionicons/dist/svg'), to: 'svg' }],
    }),
  ],
  devServer: {
    host: '0.0.0.0',
    port: 4273,
    historyApiFallback: true,
    hot: true,
    compress: true,
  },
};
