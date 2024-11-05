export default () => ({
  'adsp-strapi': {
    enabled: true,
    resolve: './src/adsp-strapi',
    config: {
      serviceId: 'urn:ads:platform:content-service',
      displayName: 'Content service',
      description: 'Content service provides a headless CMS.'
    }
  }
});
