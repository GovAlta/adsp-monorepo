'use strict';

var yup = require('yup');
var strapiUtils = require('@strapi/utils');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var yup__namespace = /*#__PURE__*/_interopNamespaceDefault(yup);

const createHomepageController = ()=>{
    const homepageService = strapi.plugin('content-manager').service('homepage');
    const recentDocumentParamsSchema = yup__namespace.object().shape({
        action: yup__namespace.mixed().oneOf([
            'update',
            'publish'
        ]).required()
    });
    return {
        async getRecentDocuments (ctx) {
            let action;
            try {
                action = (await recentDocumentParamsSchema.validate(ctx.query)).action;
            } catch (error) {
                if (error instanceof yup__namespace.ValidationError) {
                    throw new strapiUtils.errors.ValidationError(error.message);
                }
                throw error;
            }
            if (action === 'publish') {
                return {
                    data: await homepageService.getRecentlyPublishedDocuments()
                };
            }
            return {
                data: await homepageService.getRecentlyUpdatedDocuments()
            };
        },
        async getCountDocuments () {
            return {
                data: await homepageService.getCountDocuments()
            };
        }
    };
};

exports.createHomepageController = createHomepageController;
//# sourceMappingURL=homepage.js.map
