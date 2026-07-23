const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');
const { aliasReactComponents } = require('../../tools/webpack/react-components-version');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withReact(), (config) => {
  // Update the webpack config as needed here.
  // e.g. `config.plugins.push(new MyPlugin())`

  return aliasReactComponents(config, '@abgov/react-components');
});
