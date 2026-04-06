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
    filename: 'vendors.js',
    clean: true,
  },
  // Emit a single bundle — no split chunks — so the builder-app build only
  // needs to copy one file and the preview only needs one <script> tag.
  optimization: {
    splitChunks: false,
    runtimeChunk: false,
  },
  plugins: [...(commonConfig.plugins || [])],
};
