import { previewRouter } from './preview.mjs';

/**
 * The routes will be merged with the other Content Manager routers,
 * so we need to avoid conficts in the router name, and to prefix the path for each route.
 */ const routes = {
    preview: previewRouter
};

export { routes };
//# sourceMappingURL=index.mjs.map
