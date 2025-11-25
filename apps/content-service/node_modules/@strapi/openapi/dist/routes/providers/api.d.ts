import type { Core } from '@strapi/types';
import { AbstractRoutesProvider } from './abstract';
/**
 * Class representing a provider for API routes.
 *
 * This class retrieves and provides access to routes registered in the Strapi
 * APIs.
 *
 * @extends {@link AbstractRoutesProvider}
 */
export declare class ApiRoutesProvider extends AbstractRoutesProvider {
    /**
     * Retrieves all routes registered in the Strapi APIs.
     *
     * It extracts routes from the Strapi APIs by flattening their
     * structure and consolidating them into a single array of {@link Core.Route}.
     *
     * @returns An array of {@link Core.Route} objects
     */
    get routes(): Core.Route[];
}
//# sourceMappingURL=api.d.ts.map