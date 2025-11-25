import type { Core } from '@strapi/types';
import { RouteMatcher } from './matcher';
import type { RoutesProvider } from './providers';
/**
 * Class responsible for collecting and filtering routes from multiple providers.
 */
export declare class RouteCollector {
    private readonly _providers;
    private readonly _matcher;
    /**
     * @param providers - An array of route providers to collect routes from. Defaults to an empty array.
     * @param matcher - An instance of RouteMatcher to filter routes. Defaults to a new {@link RouteMatcher} with no rules.
     */
    constructor(providers?: RoutesProvider[], matcher?: RouteMatcher);
    /**
     * Collects routes from all providers and filters them based on the matcher rules.
     *
     * @returns An array of {@link Core.Route} that pass the filter rules.
     */
    collect(): Core.Route[];
    /**
     * Filters the given array of routes based on the matcher rules.
     *
     * @param routes - The list of routes to filter.
     * @returns An array of routes that match the rules.
     */
    private filter;
}
//# sourceMappingURL=collector.d.ts.map