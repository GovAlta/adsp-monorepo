/// <reference types="node" />
import http from 'http';
import Koa from 'koa';
import type { Core } from '@strapi/types';
export interface Server extends http.Server {
    destroy: () => Promise<void>;
}
declare const createHTTPServer: (strapi: Core.Strapi, koaApp: Koa) => Server;
export { createHTTPServer };
//# sourceMappingURL=http-server.d.ts.map