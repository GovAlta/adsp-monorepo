'use strict';

var z = require('zod/v4');
var utils = require('@strapi/utils');

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

const ctUIDRegexp = /^((strapi|admin)::[\w-]+|(api|plugin)::[\w-]+\.[\w-]+)$/;
const componentUIDRegexp = /^[\w-]+\.[\w-]+$/;
const baseAttributeSchema = z__namespace.object({
    type: z__namespace.string(),
    configurable: z__namespace.literal(false).optional(),
    private: z__namespace.boolean().optional(),
    pluginOptions: z__namespace.record(z__namespace.string(), z__namespace.unknown()).optional()
});
const mediaAttributeSchema = baseAttributeSchema.extend({
    type: z__namespace.literal('media'),
    multiple: z__namespace.boolean(),
    required: z__namespace.boolean().optional(),
    allowedTypes: z__namespace.array(z__namespace.string()).optional()
});
const relationAttributeSchema = baseAttributeSchema.extend({
    type: z__namespace.literal('relation'),
    relation: z__namespace.string(),
    target: z__namespace.string().regex(ctUIDRegexp),
    targetAttribute: z__namespace.string().nullable(),
    autoPopulate: z__namespace.boolean().optional(),
    mappedBy: z__namespace.string().optional(),
    inversedBy: z__namespace.string().optional()
});
const componentAttributeSchema = baseAttributeSchema.extend({
    type: z__namespace.literal('component'),
    component: z__namespace.string(),
    repeatable: z__namespace.boolean(),
    required: z__namespace.boolean().optional(),
    min: z__namespace.number().optional(),
    max: z__namespace.number().optional()
});
const dynamicZoneAttributeSchema = baseAttributeSchema.extend({
    type: z__namespace.literal('dynamiczone'),
    components: z__namespace.array(z__namespace.string().regex(componentUIDRegexp)),
    required: z__namespace.boolean().optional(),
    min: z__namespace.number().optional(),
    max: z__namespace.number().optional()
});
const uidAttributeSchema = baseAttributeSchema.extend({
    type: z__namespace.literal('uid'),
    targetField: z__namespace.string().optional()
});
const genericAttributeSchema = z__namespace.object({
    type: z__namespace.string(),
    required: z__namespace.boolean().optional(),
    unique: z__namespace.boolean().optional(),
    default: z__namespace.unknown().optional(),
    min: z__namespace.union([
        z__namespace.number(),
        z__namespace.string()
    ]).optional(),
    max: z__namespace.union([
        z__namespace.number(),
        z__namespace.string()
    ]).optional(),
    minLength: z__namespace.number().optional(),
    maxLength: z__namespace.number().optional(),
    enum: z__namespace.array(z__namespace.string()).optional(),
    regex: z__namespace.string().optional(),
    private: z__namespace.boolean().optional(),
    configurable: z__namespace.boolean().optional(),
    pluginOptions: z__namespace.record(z__namespace.string(), z__namespace.unknown()).optional()
});
const attributeSchema = z__namespace.union([
    mediaAttributeSchema,
    relationAttributeSchema,
    componentAttributeSchema,
    dynamicZoneAttributeSchema,
    uidAttributeSchema,
    genericAttributeSchema
]);
const contentTypeSchemaBase = z__namespace.object({
    displayName: z__namespace.string(),
    singularName: z__namespace.string(),
    pluralName: z__namespace.string(),
    description: z__namespace.string(),
    draftAndPublish: z__namespace.boolean(),
    kind: z__namespace.enum([
        'collectionType',
        'singleType'
    ]),
    collectionName: z__namespace.string().optional(),
    attributes: z__namespace.record(z__namespace.string(), attributeSchema),
    visible: z__namespace.boolean(),
    restrictRelationsTo: z__namespace.array(z__namespace.string()).nullable(),
    pluginOptions: z__namespace.record(z__namespace.string(), z__namespace.unknown()).optional(),
    options: z__namespace.record(z__namespace.string(), z__namespace.unknown()).optional(),
    reviewWorkflows: z__namespace.boolean().optional(),
    populateCreatorFields: z__namespace.boolean().optional(),
    comment: z__namespace.string().optional(),
    version: z__namespace.string().optional()
});
const formattedContentTypeSchema = z__namespace.object({
    uid: z__namespace.string().regex(ctUIDRegexp),
    plugin: z__namespace.string().optional(),
    apiID: z__namespace.string(),
    schema: contentTypeSchemaBase
});
const componentSchemaBase = z__namespace.object({
    displayName: z__namespace.string(),
    description: z__namespace.string(),
    icon: z__namespace.string().optional(),
    connection: z__namespace.string().optional(),
    collectionName: z__namespace.string().optional(),
    attributes: z__namespace.record(z__namespace.string(), attributeSchema),
    pluginOptions: z__namespace.record(z__namespace.string(), z__namespace.unknown()).optional()
});
const formattedComponentSchema = z__namespace.object({
    uid: z__namespace.string().regex(componentUIDRegexp),
    category: z__namespace.string(),
    apiId: z__namespace.string(),
    schema: componentSchemaBase
});
const createRoutes = utils.createContentApiRoutesFactory(()=>{
    return [
        {
            method: 'GET',
            path: '/content-types',
            handler: 'content-types.getContentTypes',
            request: {
                query: {
                    kind: z__namespace.enum([
                        'collectionType',
                        'singleType'
                    ])
                }
            },
            response: z__namespace.object({
                data: z__namespace.array(formattedContentTypeSchema)
            })
        },
        {
            method: 'GET',
            path: '/content-types/:uid',
            handler: 'content-types.getContentType',
            request: {
                params: {
                    uid: z__namespace.string().regex(ctUIDRegexp)
                }
            },
            response: z__namespace.object({
                data: formattedContentTypeSchema
            })
        },
        {
            method: 'GET',
            path: '/components',
            handler: 'components.getComponents',
            response: z__namespace.object({
                data: z__namespace.array(formattedComponentSchema)
            })
        },
        {
            method: 'GET',
            path: '/components/:uid',
            handler: 'components.getComponent',
            request: {
                params: {
                    uid: z__namespace.string().regex(componentUIDRegexp)
                }
            },
            response: z__namespace.object({
                data: formattedComponentSchema
            })
        }
    ];
});

module.exports = createRoutes;
//# sourceMappingURL=content-api.js.map
