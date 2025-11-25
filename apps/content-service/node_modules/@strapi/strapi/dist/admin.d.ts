/// <reference path="../src/types/index.d.ts" />
import { RenderAdminArgs } from '@strapi/admin/strapi-admin';
declare const render: (mountNode: HTMLElement | null, { plugins, ...restArgs }: RenderAdminArgs) => Promise<void>;
export { render as renderAdmin };
export type { RenderAdminArgs };
export * from '@strapi/admin/strapi-admin';
export { unstable_useDocumentLayout, unstable_useDocumentActions, unstable_useDocument, unstable_useContentManagerContext, useDocumentRBAC, } from '@strapi/content-manager/strapi-admin';
export { private_useAutoReloadOverlayBlocker, private_AutoReloadOverlayBlockerProvider, } from '@strapi/content-type-builder/strapi-admin';
//# sourceMappingURL=admin.d.ts.map