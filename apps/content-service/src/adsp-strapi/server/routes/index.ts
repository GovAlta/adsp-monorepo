import admin from './admin';

export default {
  admin,
  'content-api': {
    type: 'content-api',
    routes: [
      {
        method: 'GET',
        path: '/',
        // name of the controller file & the method.
        handler: 'controller.index',
        config: {
          policies: [],
        },
      },
    ],
  },
};
