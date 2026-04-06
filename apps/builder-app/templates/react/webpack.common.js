const path = require('path');
const webpack = require('webpack');

const templateRoot = __dirname;
const templateNodeModules = path.join(templateRoot, 'node_modules');

/**
 * Shared webpack configuration for template bundling.
 * Used by local dev and preview vendor bundling.
 */
module.exports = {
  target: 'web',
  resolve: {
    modules: [templateNodeModules, 'node_modules'],
    extensions: ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.json'],
    fallback: {
      fs: false,
      path: false,
      process: false,
    },
    alias: {
      '@': path.resolve(templateRoot, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: { browsers: ['last 2 versions'] } }],
              '@babel/preset-typescript',
              ['@babel/preset-react', { runtime: 'automatic' }],
            ],
          },
        },
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: { browsers: ['last 2 versions'] } }],
              ['@babel/preset-react', { runtime: 'automatic' }],
            ],
          },
        },
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/,
        type: 'asset',
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env': JSON.stringify({}),
      process: JSON.stringify({ env: { NODE_ENV: process.env.NODE_ENV || 'development' } }),
    }),
  ],
  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};
