function aliasReactComponents(config, packageName, options = {}) {
  const ds1Package = options.ds1Package || '@abgov/react-components-ds1';
  const webComponentsPackage = options.webComponentsPackage || '@abgov/web-components';
  const designTokensPackage = options.designTokensPackage || '@abgov/design-tokens';

  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve?.alias,
      '@abgov/react-components$': require.resolve(packageName),
      '@abgov/react-components-ds1$': require.resolve(ds1Package),
      '@abgov/web-components$': require.resolve(webComponentsPackage),
      '@abgov/web-components/index.css$': require.resolve(`${webComponentsPackage}/index.css`),
      '@abgov/design-tokens/dist/tokens.css$': require.resolve(`${designTokensPackage}/dist/tokens.css`),
    },
  };

  return config;
}

module.exports = { aliasReactComponents };
