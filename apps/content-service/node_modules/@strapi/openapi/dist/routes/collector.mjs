import { createDebugger } from '../utils/debug.mjs';
import 'node:crypto';
import 'zod/v4';
import { RouteMatcher } from './matcher.mjs';

const debug = createDebugger('routes:collector');
/**
 * Class responsible for collecting and filtering routes from multiple providers.
 */ class RouteCollector {
    /**
   * Collects routes from all providers and filters them based on the matcher rules.
   *
   * @returns An array of {@link Core.Route} that pass the filter rules.
   */ collect() {
        const routes = this._providers.flatMap((provider)=>Array.from(provider));
        const sanitizedRoutes = this.filter(routes);
        debug('collected %o/%o routes from %o providers %o', sanitizedRoutes.length, routes.length, this._providers.length, this._providers.map((provider)=>provider.constructor.name));
        return sanitizedRoutes;
    }
    /**
   * Filters the given array of routes based on the matcher rules.
   *
   * @param routes - The list of routes to filter.
   * @returns An array of routes that match the rules.
   */ filter(routes) {
        return routes.filter((route)=>this._matcher.match(route));
    }
    /**
   * @param providers - An array of route providers to collect routes from. Defaults to an empty array.
   * @param matcher - An instance of RouteMatcher to filter routes. Defaults to a new {@link RouteMatcher} with no rules.
   */ constructor(providers = [], matcher = new RouteMatcher()){
        this._providers = providers;
        this._matcher = matcher;
    }
}

export { RouteCollector };
//# sourceMappingURL=collector.mjs.map
