'use strict';

/**
 * Abstract class representing a provider for routes.
 *
 * This class provides a base implementation for classes that manage and provide
 * routes from Strapi.
 *
 * @implements {@link RoutesProvider}
 */ class AbstractRoutesProvider {
    /**
   * Iterator to traverse the routes.
   *
   * This generator function allows iterating over the {@link Core.Route} objects
   * managed by this provider and yielding them one at a time.
   */ *[Symbol.iterator]() {
        for (const route of this.routes){
            yield route;
        }
    }
    /**
   * @param strapi - The Strapi instance used to retrieve and manage routes.
   */ constructor(strapi){
        this._strapi = strapi;
    }
}

exports.AbstractRoutesProvider = AbstractRoutesProvider;
//# sourceMappingURL=abstract.js.map
