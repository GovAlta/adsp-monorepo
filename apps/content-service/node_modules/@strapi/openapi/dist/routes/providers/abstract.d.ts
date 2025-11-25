import type { Core } from '@strapi/types';
import type { RoutesProvider } from './types';
/**
 * Abstract class representing a provider for routes.
 *
 * This class provides a base implementation for classes that manage and provide
 * routes from Strapi.
 *
 * @implements {@link RoutesProvider}
 */
export declare abstract class AbstractRoutesProvider implements RoutesProvider {
    /**
     * Reference to the Strapi instance.
     */
    protected readonly _strapi: Core.Strapi;
    /**
     * @param strapi - The Strapi instance used to retrieve and manage routes.
     */
    constructor(strapi: Core.Strapi);
    /**
     * Retrieves an array of routes.
     *
     * Classes extending this abstract class must provide their own implementation
     * for returning the list of routes they manage.
     */
    abstract get routes(): Core.Route[];
    /**
     * Iterator to traverse the routes.
     *
     * This generator function allows iterating over the {@link Core.Route} objects
     * managed by this provider and yielding them one at a time.
     */
    [Symbol.iterator](): Iterator<Core.Route>;
}
//# sourceMappingURL=abstract.d.ts.map