import { historyVersionRouter } from './history-version.mjs';

/**
 * The routes will me merged with the other Content Manager routers,
 * so we need to avoid conficts in the router name, and to prefix the path for each route.
 */ const routes = {
    'history-version': historyVersionRouter
};

export { routes };
//# sourceMappingURL=index.mjs.map
