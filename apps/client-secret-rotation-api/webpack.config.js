const { composePlugins, withNx } = require('@nx/webpack');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), (config, { context }) => {
  return require('./webpack.config.old.js')(config, context);
});
