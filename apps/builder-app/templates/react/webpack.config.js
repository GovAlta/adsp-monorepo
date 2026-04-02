const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const commonConfig = require('./webpack.common.js');

const templateRoot = __dirname;

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
  ],
  devServer: {
    host: '0.0.0.0',
    port: 4273,
    historyApiFallback: true,
    hot: true,
    compress: true,
  },
};
