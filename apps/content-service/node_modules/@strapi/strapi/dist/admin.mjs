import { renderAdmin } from '@strapi/admin/strapi-admin';
export * from '@strapi/admin/strapi-admin';
import contentTypeBuilder from '@strapi/content-type-builder/strapi-admin';
export { private_AutoReloadOverlayBlockerProvider, private_useAutoReloadOverlayBlocker } from '@strapi/content-type-builder/strapi-admin';
import contentManager from '@strapi/content-manager/strapi-admin';
export { unstable_useContentManagerContext, unstable_useDocument, unstable_useDocumentActions, unstable_useDocumentLayout, useDocumentRBAC } from '@strapi/content-manager/strapi-admin';
import email from '@strapi/email/strapi-admin';
import upload from '@strapi/upload/strapi-admin';
import i18n from '@strapi/i18n/strapi-admin';
import contentReleases from '@strapi/content-releases/strapi-admin';
import reviewWorkflows from '@strapi/review-workflows/strapi-admin';

const render = (mountNode, { plugins, ...restArgs })=>{
    return renderAdmin(mountNode, {
        ...restArgs,
        plugins: {
            'content-manager': contentManager,
            'content-type-builder': contentTypeBuilder,
            email,
            upload,
            contentReleases,
            i18n,
            reviewWorkflows,
            ...plugins
        }
    });
};

export { render as renderAdmin };
//# sourceMappingURL=admin.mjs.map
