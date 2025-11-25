import type { Core } from '@strapi/types';
/**
 * A Strapi middleware function that adds support for review workflows.
 *
 * Why is it needed ?
 * For now, the admin panel cannot have anything but top-level attributes in the content-type for options.
 * But we need the CE part to be agnostics from Review Workflow (which is an EE feature).
 * CE handle the `options` object, that's why we move the reviewWorkflows boolean to the options object.
 *
 * @param {object} strapi - The Strapi instance.
 */
export declare function contentTypeMiddleware(strapi: Core.Strapi): void;
declare const _default: {
    contentTypeMiddleware: typeof contentTypeMiddleware;
};
export default _default;
//# sourceMappingURL=review-workflows.d.ts.map