import { type Core } from '@strapi/types';
import { AbstractRoutesProvider } from './abstract';
/**
 * Class providing routes from Strapi plugins.
 *
 * This class extracts and consolidates routes registered by Strapi plugins,
 * accommodating different ways plugins may define their routes.
 *
 * @extends {@link AbstractRoutesProvider}
 */
export declare class PluginRoutesProvider extends AbstractRoutesProvider {
    /**
     * Retrieves all routes registered in the Strapi plugins.
     *
     * It handles two cases:
     * - The plugin's routes are directly provided as a {@link Core.Route}[].
     * - The plugin's routes are defined as a record of routers which contain their own list of routes.
     *
     * @returns An array of {@link Core.Route} objects.
     */
    get routes(): Core.Route[];
}
//# sourceMappingURL=plugin.d.ts.map