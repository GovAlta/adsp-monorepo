const { composePlugins, withNx } = require('@nx/webpack');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), (config) => {
  // Node.js target: no browser polyfills needed
  config.target = 'node';
  return config;
});
