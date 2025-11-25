import { RouteObject } from 'react-router-dom';
/**
 * These are routes we don't want to be able to be changed by plugins.
 */
declare const getImmutableRoutes: () => RouteObject[];
declare const getInitialRoutes: () => RouteObject[];
export { getImmutableRoutes, getInitialRoutes };
