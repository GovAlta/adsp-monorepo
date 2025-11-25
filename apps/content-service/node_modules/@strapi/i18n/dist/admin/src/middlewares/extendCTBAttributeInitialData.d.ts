import type { Middleware } from '@reduxjs/toolkit';
import type { Store } from '@strapi/admin/strapi-admin';
declare const extendCTBAttributeInitialDataMiddleware: () => Middleware<object, ReturnType<Store['getState']>>;
export { extendCTBAttributeInitialDataMiddleware };
