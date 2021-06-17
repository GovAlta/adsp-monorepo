const getBaseConfig = require('@nrwl/react/plugins/webpack');

module.exports = (config) => {
  config = getBaseConfig(config);

  config.node = {
    fs: 'empty'
  };

  return config;
};
