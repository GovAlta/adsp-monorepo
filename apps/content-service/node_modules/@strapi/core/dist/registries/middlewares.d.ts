/// <reference types="lodash" />
import type { Core, UID } from '@strapi/types';
type MiddlewareExtendFn = (middleware: Core.Middleware) => Core.Middleware;
declare const middlewaresRegistry: () => {
    /**
     * Returns this list of registered middlewares uids
     */
    keys(): string[];
    /**
     * Returns the instance of a middleware. Instantiate the middleware if not already done
     */
    get(uid: UID.Middleware): Core.Middleware;
    /**
     * Returns a map with all the middlewares in a namespace
     */
    getAll(namespace: string): import("lodash").Dictionary<unknown>;
    /**
     * Registers a middleware
     */
    set(uid: UID.Middleware, middleware: Core.Middleware): any;
    /**
     * Registers a map of middlewares for a specific namespace
     */
    add(namespace: string, rawMiddlewares?: Record<string, Core.Middleware>): void;
    /**
     * Wraps a middleware to extend it
     */
    extend(uid: UID.Middleware, extendFn: MiddlewareExtendFn): any;
};
export default middlewaresRegistry;
//# sourceMappingURL=middlewares.d.ts.map