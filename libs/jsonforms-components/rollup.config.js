const nrwlConfig = require('@nx/react/plugins/bundle-rollup');

module.exports = (config) => {
  const {
    output: [output],
    ...nxConfig
  } = nrwlConfig(config);
  return {
    ...nxConfig,
    output: [
      {
        ...output,
        paths: {
          '@abgov/react-components': '@abgov/react-components',
        },
      },
    ],
  };
};
