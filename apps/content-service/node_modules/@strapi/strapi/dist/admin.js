'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');
var contentTypeBuilder = require('@strapi/content-type-builder/strapi-admin');
var contentManager = require('@strapi/content-manager/strapi-admin');
var email = require('@strapi/email/strapi-admin');
var upload = require('@strapi/upload/strapi-admin');
var i18n = require('@strapi/i18n/strapi-admin');
var contentReleases = require('@strapi/content-releases/strapi-admin');
var reviewWorkflows = require('@strapi/review-workflows/strapi-admin');

const render = (mountNode, { plugins, ...restArgs })=>{
    return strapiAdmin.renderAdmin(mountNode, {
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

Object.defineProperty(exports, "private_AutoReloadOverlayBlockerProvider", {
  enumerable: true,
  get: function () { return contentTypeBuilder.private_AutoReloadOverlayBlockerProvider; }
});
Object.defineProperty(exports, "private_useAutoReloadOverlayBlocker", {
  enumerable: true,
  get: function () { return contentTypeBuilder.private_useAutoReloadOverlayBlocker; }
});
Object.defineProperty(exports, "unstable_useContentManagerContext", {
  enumerable: true,
  get: function () { return contentManager.unstable_useContentManagerContext; }
});
Object.defineProperty(exports, "unstable_useDocument", {
  enumerable: true,
  get: function () { return contentManager.unstable_useDocument; }
});
Object.defineProperty(exports, "unstable_useDocumentActions", {
  enumerable: true,
  get: function () { return contentManager.unstable_useDocumentActions; }
});
Object.defineProperty(exports, "unstable_useDocumentLayout", {
  enumerable: true,
  get: function () { return contentManager.unstable_useDocumentLayout; }
});
Object.defineProperty(exports, "useDocumentRBAC", {
  enumerable: true,
  get: function () { return contentManager.useDocumentRBAC; }
});
exports.renderAdmin = render;
Object.keys(strapiAdmin).forEach(function (k) {
  if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
    enumerable: true,
    get: function () { return strapiAdmin[k]; }
  });
});
//# sourceMappingURL=admin.js.map
