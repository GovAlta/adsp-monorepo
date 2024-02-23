const nrwlConfig = require('@nx/react/plugins/bundle-rollup');

module.exports = (config) => {
  const { output, ...nxConfig } = nrwlConfig(config);
  return {
    ...nxConfig,
    output: {
      ...output,
      paths: {
        '@abgov/react-components-new': '@abgov/react-components',
      },
    },
  };
};
