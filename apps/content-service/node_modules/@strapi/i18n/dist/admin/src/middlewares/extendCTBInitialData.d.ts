import type { Middleware } from '@reduxjs/toolkit';
import type { Store } from '@strapi/admin/strapi-admin';
declare const extendCTBInitialDataMiddleware: () => Middleware<object, ReturnType<Store['getState']>>;
export { extendCTBInitialDataMiddleware };
