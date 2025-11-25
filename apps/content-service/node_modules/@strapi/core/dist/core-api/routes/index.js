'use strict';

var strapiUtils = require('@strapi/utils');
var z = require('zod/v4');
var contentType = require('./validation/content-type.js');

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

var z__namespace = /*#__PURE__*/_interopNamespaceDefault(z);

const createRoutes = ({ strapi: strapi1, contentType })=>{
    if (strapiUtils.contentTypes.isSingleType(contentType)) {
        return getSingleTypeRoutes(contentType, strapi1);
    }
    return getCollectionTypeRoutes(contentType, strapi1);
};
const getSingleTypeRoutes = (schema, strapi1)=>{
    const { uid, info } = schema;
    const validator = new contentType.CoreContentTypeRouteValidator(strapi1, uid);
    const conditionalQueryParams = getConditionalQueryParams(schema);
    return {
        find: {
            method: 'GET',
            path: `/${info.singularName}`,
            handler: `${uid}.find`,
            request: {
                query: validator.queryParams([
                    'fields',
                    'populate',
                    'filters',
                    ...conditionalQueryParams
                ])
            },
            response: z__namespace.object({
                data: validator.document
            }),
            config: {}
        },
        update: {
            method: 'PUT',
            path: `/${info.singularName}`,
            handler: `${uid}.update`,
            request: {
                query: validator.queryParams([
                    'fields',
                    'populate',
                    ...conditionalQueryParams
                ]),
                body: {
                    'application/json': validator.partialBody
                }
            },
            response: z__namespace.object({
                data: validator.document
            }),
            config: {}
        },
        delete: {
            method: 'DELETE',
            path: `/${info.singularName}`,
            handler: `${uid}.delete`,
            request: {
                query: validator.queryParams([
                    'fields',
                    'populate',
                    ...conditionalQueryParams
                ])
            },
            response: z__namespace.object({
                data: validator.document
            }),
            config: {}
        }
    };
};
const getCollectionTypeRoutes = (schema, strapi1)=>{
    const { uid, info } = schema;
    const validator = new contentType.CoreContentTypeRouteValidator(strapi1, uid);
    const conditionalQueryParams = getConditionalQueryParams(schema);
    return {
        find: {
            method: 'GET',
            path: `/${info.pluralName}`,
            handler: `${uid}.find`,
            request: {
                query: validator.queryParams([
                    'fields',
                    'filters',
                    '_q',
                    'pagination',
                    'sort',
                    'populate',
                    ...conditionalQueryParams
                ])
            },
            response: z__namespace.object({
                data: validator.documents
            }),
            config: {}
        },
        findOne: {
            method: 'GET',
            path: `/${info.pluralName}/:id`,
            handler: `${uid}.findOne`,
            request: {
                params: {
                    id: validator.documentID
                },
                query: validator.queryParams([
                    'fields',
                    'populate',
                    'filters',
                    'sort',
                    ...conditionalQueryParams
                ])
            },
            response: z__namespace.object({
                data: validator.document
            })
        },
        create: {
            method: 'POST',
            path: `/${info.pluralName}`,
            handler: `${uid}.create`,
            request: {
                query: validator.queryParams([
                    'fields',
                    'populate',
                    ...conditionalQueryParams
                ]),
                body: {
                    'application/json': validator.body
                }
            },
            response: z__namespace.object({
                data: validator.document
            }),
            config: {}
        },
        update: {
            method: 'PUT',
            path: `/${info.pluralName}/:id`,
            handler: `${uid}.update`,
            request: {
                query: validator.queryParams([
                    'fields',
                    'populate',
                    ...conditionalQueryParams
                ]),
                params: {
                    id: validator.documentID
                },
                body: {
                    'application/json': validator.partialBody
                }
            },
            response: z__namespace.object({
                data: validator.document
            })
        },
        delete: {
            method: 'DELETE',
            path: `/${info.pluralName}/:id`,
            handler: `${uid}.delete`,
            request: {
                query: validator.queryParams([
                    'fields',
                    'populate',
                    'filters',
                    ...conditionalQueryParams
                ]),
                params: {
                    id: validator.documentID
                }
            },
            response: z__namespace.object({
                data: validator.document
            })
        }
    };
};
const getConditionalQueryParams = (schema)=>{
    const isLocalized = strapi.plugin('i18n').service('content-types').isLocalizedContentType(schema);
    const hasDraftAndPublish = strapiUtils.contentTypes.hasDraftAndPublish(schema);
    return [
        ...isLocalized ? [
            'locale'
        ] : [],
        ...hasDraftAndPublish ? [
            'status'
        ] : []
    ];
};

exports.createRoutes = createRoutes;
//# sourceMappingURL=index.js.map
