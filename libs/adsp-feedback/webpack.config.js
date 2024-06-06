const { composePlugins, withNx, withWeb } = require('@nx/webpack');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withWeb(), (config) => {
  // Update the webpack config as needed here.
  // e.g. `config.plugins.push(new MyPlugin())`

  // NOTE: workaround for https://github.com/nrwl/nx/issues/21773
  const svgRule = config.module.rules.find((rule) => typeof rule === 'object' && rule.test.toString().includes('svg'));
  if (svgRule) {
    // Always use data URL for svg assets since the widget needs to be self-contained.
    svgRule.parser.dataUrlCondition = () => true;
  }

  config.output.library = {
    name: 'adspFeedback',
    type: 'var',
    export: ['default'],
  };

  return config;
});
