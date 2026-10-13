const path = require('path');

const templateRoot = path.resolve(__dirname, 'templates/react');
const commonConfig = require(path.join(templateRoot, 'webpack.common.js'));

module.exports = {
  ...commonConfig,
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: false,
  entry: path.resolve(__dirname, 'templates/preview/react/vendors.entry.js'),
  output: {
    path: path.resolve(__dirname, '.generated/template-bundles/react'),
    // Content-hashed names: the app is served with a one-year immutable cache for scripts, so a stable
    // name would never reach browsers that already cached an earlier bundle. build-template-react-vendors.js
    // writes the entry name to a manifest that the builder-app build reads.
    filename: 'vendors.[contenthash:8].js',
    chunkFilename: 'vendors.[id].[contenthash:8].js',
    clean: true,
  },
  // Emit a single entry bundle — no split chunks — so the preview only needs one <script> tag. Lazy chunks
  // from dynamic imports still exist; deterministic ids keep their names short and stable.
  optimization: {
    splitChunks: false,
    runtimeChunk: false,
    chunkIds: 'deterministic',
  },
  plugins: [...(commonConfig.plugins || [])],
};
