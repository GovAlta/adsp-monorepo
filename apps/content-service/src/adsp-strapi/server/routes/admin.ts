export default {
  type: 'admin',
  routes: [
    {
      method: 'POST',
      path: '/user',
      handler: 'user.create',
      config: {
        policies: ['plugin::adsp-strapi.isAdminUser'],
      },
    },
  ],
};
