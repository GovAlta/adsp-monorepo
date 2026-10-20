const { composePlugins, withNx } = require('@nx/webpack');

module.exports = composePlugins(withNx(), (config, { options, context }) => {
  return require('./webpack.config.old.js')(config, context);
});
