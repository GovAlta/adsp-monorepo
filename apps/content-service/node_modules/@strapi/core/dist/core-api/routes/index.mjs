import { contentTypes } from '@strapi/utils';
import * as z from 'zod/v4';
import { CoreContentTypeRouteValidator } from './validation/content-type.mjs';

const createRoutes = ({ strapi: strapi1, contentType })=>{
    if (contentTypes.isSingleType(contentType)) {
        return getSingleTypeRoutes(contentType, strapi1);
    }
    return getCollectionTypeRoutes(contentType, strapi1);
};
const getSingleTypeRoutes = (schema, strapi1)=>{
    const { uid, info } = schema;
    const validator = new CoreContentTypeRouteValidator(strapi1, uid);
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
            response: z.object({
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
            response: z.object({
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
            response: z.object({
                data: validator.document
            }),
            config: {}
        }
    };
};
const getCollectionTypeRoutes = (schema, strapi1)=>{
    const { uid, info } = schema;
    const validator = new CoreContentTypeRouteValidator(strapi1, uid);
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
            response: z.object({
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
            response: z.object({
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
            response: z.object({
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
            response: z.object({
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
            response: z.object({
                data: validator.document
            })
        }
    };
};
const getConditionalQueryParams = (schema)=>{
    const isLocalized = strapi.plugin('i18n').service('content-types').isLocalizedContentType(schema);
    const hasDraftAndPublish = contentTypes.hasDraftAndPublish(schema);
    return [
        ...isLocalized ? [
            'locale'
        ] : [],
        ...hasDraftAndPublish ? [
            'status'
        ] : []
    ];
};

export { createRoutes };
//# sourceMappingURL=index.mjs.map
