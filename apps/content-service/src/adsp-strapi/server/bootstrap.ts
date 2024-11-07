import type { Core } from '@strapi/strapi';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  // bootstrap phase
  const conditions = [
    {
      displayName: 'Is tenant user',
      name: 'is-tenant-user',
      plugin: 'adsp-strapi',
      handler: (user) => {
        return { name: user.name };
      },
    },
  ];

  await strapi.admin.services.permission.conditionProvider.registerMany(conditions);
};

export default bootstrap;
