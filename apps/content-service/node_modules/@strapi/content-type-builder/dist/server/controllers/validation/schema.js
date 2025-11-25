'use strict';

var zod = require('zod');
var utils = require('@strapi/utils');
var fp = require('lodash/fp');
var builder = require('../../services/builder.js');
var constants = require('../../services/constants.js');
var common = require('./common.js');

const uniqueAttributeName = (attributes, ctx)=>{
    const names = new Set(attributes.map((attribute)=>fp.snakeCase(attribute.name)));
    if (names.size !== attributes.length) {
        ctx.addIssue({
            code: zod.z.ZodIssueCode.custom,
            message: 'Attributes must have unique names'
        });
    }
};
const verifyUidTargetField = (attributes, ctx)=>{
    attributes.forEach((attribute)=>{
        if (!attribute.properties) {
            return;
        }
        const { properties, action } = attribute;
        if (properties.type === 'uid' && properties.targetField) {
            const targetAttr = attributes.find((attr)=>attr.name === properties.targetField);
            if (!targetAttr) {
                // NOTE: on update we are setting it to undefined later in the process instead to handle renames
                if (action === 'create') {
                    ctx.addIssue({
                        code: zod.z.ZodIssueCode.custom,
                        message: 'Target does not exist'
                    });
                }
            } else if (!constants.VALID_UID_TARGETS.some((validUIdTarget)=>validUIdTarget === targetAttr.properties?.type)) {
                ctx.addIssue({
                    code: zod.z.ZodIssueCode.custom,
                    message: 'Invalid target type'
                });
            }
        }
    });
};
const verifySingularAndPluralNames = (obj, ctx)=>{
    // singular and plural can only be provided on creation
    if (obj.action !== 'create') {
        return;
    }
    if (obj.singularName === obj.pluralName) {
        ctx.addIssue({
            code: zod.z.ZodIssueCode.custom,
            message: 'Singular and plural names must be different',
            path: [
                'singularName'
            ]
        });
    }
};
const maxLengthGreaterThanMinLength = (value, ctx)=>{
    if (!fp.isNil(value.maxLength) && !fp.isNil(value.minLength) && fp.isNumber(value.maxLength) && fp.isNumber(value.minLength)) {
        if (value.maxLength < value.minLength) {
            ctx.addIssue({
                code: zod.z.ZodIssueCode.custom,
                message: 'maxLength must be greater or equal to minLength',
                path: [
                    'maxLength'
                ]
            });
        }
    }
};
const maxGreaterThanMin = (value, ctx)=>{
    if (!fp.isNil(value.max) && !fp.isNil(value.min) && fp.isNumber(value.max) && fp.isNumber(value.min)) {
        if (value.max < value.min) {
            ctx.addIssue({
                code: zod.z.ZodIssueCode.custom,
                message: 'max must be greater or equal to min',
                path: [
                    'max'
                ]
            });
        }
    }
};
const checkUserTarget = (value, ctx)=>{
    if (value.type !== 'relation') {
        return;
    }
    if (fp.isUndefined(value.target) || fp.isUndefined(value.relation)) {
        return;
    }
    const { target, relation, targetAttribute } = value;
    if (target === constants.coreUids.STRAPI_USER && (!STRAPI_USER_RELATIONS.includes(relation) || !fp.isUndefined(targetAttribute))) {
        ctx.addIssue({
            code: zod.z.ZodIssueCode.custom,
            path: [
                'relation'
            ],
            message: `Relations to ${constants.coreUids.STRAPI_USER} must be one of the following values: ${STRAPI_USER_RELATIONS.join(', ')} without targetAttribute`
        });
    }
};
const uidRefinement = (value, ctx)=>{
    if (!fp.isNil(value.targetField) && !fp.isNil(value.default)) {
        ctx.addIssue({
            code: zod.z.ZodIssueCode.custom,
            message: 'Cannot define a default UID if the targetField is set',
            path: [
                'default'
            ]
        });
    }
};
const enumRefinement = (value, ctx)=>{
    if (value.type === 'enumeration' && !fp.isNil(value.default) && !fp.isNil(value.enum)) {
        if (value.default === '' || !value.enum.some((v)=>v === value.default)) {
            ctx.addIssue({
                code: zod.z.ZodIssueCode.custom,
                message: 'Default value must be one of the enum values',
                path: [
                    'default'
                ]
            });
        }
    }
};
const conditionSchema = zod.z.object({
    visible: zod.z.record(zod.z.string(), zod.z.array(zod.z.any()))
});
const basePropertiesSchema = zod.z.object({
    type: zod.z.enum([
        'string',
        'text',
        'richtext',
        'blocks',
        'json',
        'enumeration',
        'password',
        'email',
        'integer',
        'biginteger',
        'float',
        'decimal',
        'time',
        'datetime',
        'date',
        'timestamp',
        'boolean',
        'component',
        'uid',
        'customField',
        'media',
        'relation',
        'dynamiczone'
    ]),
    configurable: zod.z.boolean().nullish(),
    private: zod.z.boolean().nullish(),
    pluginOptions: zod.z.record(zod.z.unknown()).optional(),
    conditions: zod.z.preprocess((val)=>{
        return val;
    }, conditionSchema.optional())
});
const maxLengthSchema = zod.z.number().int().positive().optional();
const minLengthSchema = zod.z.number().int().positive().optional();
const requiredSchema = zod.z.boolean().optional();
const uniqueSchema = zod.z.boolean().optional();
const STRAPI_USER_RELATIONS = [
    'oneToOne',
    'oneToMany'
];
const baseRelationSchema = zod.z.object({
    type: zod.z.literal('relation'),
    relation: zod.z.enum([
        'oneToOne',
        'oneToMany',
        'manyToOne',
        'manyToMany',
        'morphOne',
        'morphMany',
        'morphToOne',
        'morphToMany'
    ]),
    configurable: zod.z.boolean().nullish(),
    private: zod.z.boolean().nullish(),
    pluginOptions: zod.z.record(zod.z.unknown()).optional(),
    conditions: zod.z.preprocess((val)=>{
        return val;
    }, conditionSchema.optional())
});
const oneToOneSchema = baseRelationSchema.extend({
    relation: zod.z.literal('oneToOne'),
    target: zod.z.string(),
    targetAttribute: zod.z.string().nullish()
});
const oneWaySchema = baseRelationSchema.extend({
    relation: zod.z.literal('oneToOne'),
    target: zod.z.string()
});
const oneToManySchema = baseRelationSchema.extend({
    relation: zod.z.literal('oneToMany'),
    target: zod.z.string(),
    targetAttribute: zod.z.string().nullish()
});
const manyWaySchema = baseRelationSchema.extend({
    relation: zod.z.literal('oneToMany'),
    target: zod.z.string()
});
const manyToOneSchema = baseRelationSchema.extend({
    relation: zod.z.literal('manyToOne'),
    target: zod.z.string(),
    targetAttribute: zod.z.string().nullish()
});
const manyToManySchema = baseRelationSchema.extend({
    relation: zod.z.literal('manyToMany'),
    target: zod.z.string(),
    targetAttribute: zod.z.string().nullish()
});
const morphOneSchema = baseRelationSchema.extend({
    relation: zod.z.literal('morphOne'),
    target: zod.z.string(),
    targetAttribute: zod.z.string().nullish()
});
const morphManySchema = baseRelationSchema.extend({
    relation: zod.z.literal('morphMany'),
    target: zod.z.string(),
    targetAttribute: zod.z.string().nullish()
});
const morphToOneSchema = baseRelationSchema.extend({
    relation: zod.z.literal('morphToOne')
});
const morphToManySchema = baseRelationSchema.extend({
    relation: zod.z.literal('morphToMany')
});
const createRelationSchema = (meta)=>{
    switch(meta.modelType){
        case 'contentType':
            {
                switch(meta.kind){
                    case 'singleType':
                        return zod.z.discriminatedUnion('relation', [
                            oneToOneSchema,
                            oneToManySchema,
                            morphOneSchema,
                            morphManySchema,
                            morphToOneSchema,
                            morphToManySchema
                        ]);
                    case 'collectionType':
                        return zod.z.discriminatedUnion('relation', [
                            oneToOneSchema,
                            oneToManySchema,
                            manyToOneSchema,
                            manyToManySchema,
                            morphOneSchema,
                            morphManySchema,
                            morphToOneSchema,
                            morphToManySchema
                        ]);
                    default:
                        throw new Error('Invalid content type kind');
                }
            }
        case 'component':
            {
                return zod.z.discriminatedUnion('relation', [
                    oneWaySchema,
                    manyWaySchema
                ]);
            }
        default:
            throw new Error('Invalid model type');
    }
};
const richTextSchema = basePropertiesSchema.extend({
    type: zod.z.literal('richtext'),
    required: requiredSchema,
    minLength: minLengthSchema,
    maxLength: maxLengthSchema,
    default: zod.z.string().optional()
});
const blocksSchema = basePropertiesSchema.extend({
    type: zod.z.literal('blocks'),
    required: requiredSchema
});
const jsonSchema = basePropertiesSchema.extend({
    type: zod.z.literal('json'),
    required: requiredSchema,
    default: zod.z.unknown().optional().refine((value)=>{
        if (value === undefined) {
            return true;
        }
        if (fp.isNumber(value) || fp.isNull(value) || fp.isObject(value) || fp.isArray(value)) {
            return true;
        }
        try {
            JSON.parse(value);
            return true;
        } catch (err) {
            return false;
        }
    })
});
const enumerationSchema = basePropertiesSchema.extend({
    type: zod.z.literal('enumeration'),
    required: requiredSchema,
    default: zod.z.string().optional(),
    enumName: zod.z.string().optional().refine((value)=>{
        return value === '' || common.NAME_REGEX.test(value);
    }, 'Invalid enum name'),
    enum: zod.z.array(zod.z.string().refine((value)=>{
        return value === '' || !utils.strings.startsWithANumber(value);
    })).min(1).refine((values)=>{
        const filtered = [
            ...new Set(values)
        ];
        return filtered.length === values.length;
    })
});
const textSchema = basePropertiesSchema.extend({
    type: zod.z.literal('text'),
    default: zod.z.string().nullish(),
    minLength: minLengthSchema,
    maxLength: maxLengthSchema,
    required: requiredSchema,
    unique: uniqueSchema,
    regex: zod.z.string().optional().refine((value)=>{
        return value === '' || !!new RegExp(value);
    }, 'Invalid regular expression pattern')
});
const stringSchema = textSchema.extend({
    type: zod.z.literal('string')
});
const passwordSchema = basePropertiesSchema.extend({
    type: zod.z.literal('password'),
    required: requiredSchema,
    minLength: minLengthSchema,
    maxLength: maxLengthSchema
});
const emailSchema = basePropertiesSchema.extend({
    type: zod.z.literal('email'),
    required: requiredSchema,
    minLength: minLengthSchema,
    maxLength: maxLengthSchema,
    default: zod.z.string().email().optional(),
    unique: uniqueSchema
});
const integerSchema = basePropertiesSchema.extend({
    type: zod.z.literal('integer'),
    required: requiredSchema,
    default: zod.z.number().int().optional(),
    unique: uniqueSchema,
    min: zod.z.number().int().optional(),
    max: zod.z.number().int().optional()
});
const bigIntegerSchema = basePropertiesSchema.extend({
    type: zod.z.literal('biginteger'),
    required: requiredSchema,
    unique: uniqueSchema,
    default: zod.z.string().regex(/^\d*$/).nullish(),
    min: zod.z.string().regex(/^\d*$/).nullish(),
    max: zod.z.string().regex(/^\d*$/).nullish()
});
const floatSchema = basePropertiesSchema.extend({
    type: zod.z.literal('float'),
    required: requiredSchema,
    unique: uniqueSchema,
    default: zod.z.number().optional(),
    min: zod.z.number().optional(),
    max: zod.z.number().optional()
});
const decimalSchema = basePropertiesSchema.extend({
    type: zod.z.literal('decimal'),
    required: requiredSchema,
    unique: uniqueSchema,
    default: zod.z.number().optional(),
    min: zod.z.number().optional(),
    max: zod.z.number().optional()
});
const timeSchema = basePropertiesSchema.extend({
    type: zod.z.literal('time'),
    required: requiredSchema,
    unique: uniqueSchema,
    default: zod.z.string().optional()
});
const dateSchema = timeSchema.extend({
    type: zod.z.literal('date')
});
const dateTimeSchema = timeSchema.extend({
    type: zod.z.literal('datetime')
});
const timeStampSchema = basePropertiesSchema.extend({
    type: zod.z.literal('timestamp')
});
const booleanSchema = basePropertiesSchema.extend({
    type: zod.z.literal('boolean'),
    required: requiredSchema,
    default: zod.z.boolean().optional()
});
const componentSchema = basePropertiesSchema.extend({
    type: zod.z.literal('component'),
    component: zod.z.string(),
    repeatable: zod.z.boolean().optional(),
    required: requiredSchema,
    min: zod.z.number().optional(),
    max: zod.z.number().optional()
});
const dynamicZoneSchema = basePropertiesSchema.extend({
    type: zod.z.literal('dynamiczone'),
    components: zod.z.array(zod.z.string()).nonempty(),
    required: requiredSchema,
    min: zod.z.number().optional(),
    max: zod.z.number().optional()
});
const mediaSchema = basePropertiesSchema.extend({
    type: zod.z.literal('media'),
    multiple: zod.z.boolean().optional(),
    required: requiredSchema,
    allowedTypes: zod.z.array(zod.z.enum([
        'images',
        'videos',
        'files',
        'audios'
    ])).nonempty().optional()
});
const uidSchema = basePropertiesSchema.extend({
    type: zod.z.literal('uid'),
    targetField: zod.z.string().nullish(),
    required: requiredSchema,
    default: zod.z.string().nullish(),
    minLength: minLengthSchema,
    maxLength: maxLengthSchema,
    options: zod.z.object({
        separator: zod.z.string().optional(),
        lowercase: zod.z.boolean().optional(),
        decamelize: zod.z.boolean().optional(),
        customReplacements: zod.z.array(zod.z.array(zod.z.string()).length(2)).optional(),
        preserveLeadingUnderscore: zod.z.boolean().optional()
    }).optional(),
    regex: zod.z.string().optional().refine((value)=>{
        return value === '' || !!new RegExp(value);
    }, 'Invalid regular expression pattern')
});
const customFieldSchema = basePropertiesSchema.extend({
    type: zod.z.literal('customField'),
    customField: zod.z.string()
});
const attributePropertiesSchema = (meta)=>{
    const relationSchema = createRelationSchema(meta);
    const base = zod.z.union([
        mediaSchema,
        textSchema,
        stringSchema,
        richTextSchema,
        blocksSchema,
        jsonSchema,
        enumerationSchema,
        passwordSchema,
        emailSchema,
        integerSchema,
        bigIntegerSchema,
        floatSchema,
        decimalSchema,
        timeSchema,
        dateSchema,
        dateTimeSchema,
        timeStampSchema,
        booleanSchema,
        componentSchema,
        customFieldSchema.passthrough(),
        relationSchema
    ]);
    if (meta.modelType === 'component') {
        return base.superRefine(enumRefinement).superRefine(checkUserTarget).superRefine(maxGreaterThanMin).superRefine(maxLengthGreaterThanMinLength);
    }
    return zod.z.union([
        ...base.options,
        uidSchema,
        dynamicZoneSchema
    ]).superRefine(enumRefinement).superRefine(checkUserTarget).superRefine(uidRefinement).superRefine(maxGreaterThanMin).superRefine(maxLengthGreaterThanMinLength);
};
const createAttributeSchema = (meta)=>zod.z.object({
        action: zod.z.literal('create'),
        name: zod.z.string().regex(common.NAME_REGEX).refine((value)=>!builder.isReservedAttributeName(value), 'Attribute name is reserved'),
        properties: attributePropertiesSchema(meta)
    });
const updateAttributeSchema = (meta)=>zod.z.object({
        action: zod.z.literal('update'),
        name: zod.z.string(),
        properties: attributePropertiesSchema(meta)
    });
const deleteAttributeSchema = zod.z.object({
    action: zod.z.literal('delete'),
    name: zod.z.string()
});
const contentTypeUIDSchema = zod.z.custom((value)=>{
    return typeof value === 'string' && value.length > 0;
});
const componentUIDSchema = zod.z.custom((value)=>{
    return typeof value === 'string' && value.length > 0;
});
const categorySchema = zod.z.string().min(1).regex(common.CATEGORY_NAME_REGEX);
const baseComponentSchema = zod.z.object({
    uid: componentUIDSchema,
    displayName: zod.z.string().min(1),
    icon: zod.z.string().regex(common.ICON_REGEX).optional(),
    description: zod.z.string().optional(),
    category: categorySchema,
    pluginOptions: zod.z.record(zod.z.string(), zod.z.unknown()).optional()
});
const createComponentSchema = baseComponentSchema.extend({
    action: zod.z.literal('create'),
    config: zod.z.record(zod.z.string(), zod.z.unknown()).optional().default({}),
    attributes: zod.z.array(createAttributeSchema({
        modelType: 'component'
    })).superRefine(uniqueAttributeName)
});
const updateComponentSchema = baseComponentSchema.extend({
    action: zod.z.literal('update'),
    category: categorySchema.optional(),
    attributes: zod.z.array(zod.z.discriminatedUnion('action', [
        createAttributeSchema({
            modelType: 'component'
        }),
        updateAttributeSchema({
            modelType: 'component'
        }),
        deleteAttributeSchema
    ])).superRefine(uniqueAttributeName)
});
const deleteComponentSchema = zod.z.object({
    action: zod.z.literal('delete'),
    uid: componentUIDSchema
});
const baseContentTypeSchema = zod.z.object({
    uid: contentTypeUIDSchema,
    displayName: zod.z.string().min(1),
    description: zod.z.string().optional(),
    draftAndPublish: zod.z.boolean(),
    options: zod.z.record(zod.z.unknown()).optional().default({}),
    pluginOptions: zod.z.record(zod.z.unknown()).optional().default({}),
    kind: zod.z.enum([
        constants.typeKinds.SINGLE_TYPE,
        constants.typeKinds.COLLECTION_TYPE
    ]).optional()
});
const baseCreateContentTypeSchema = baseContentTypeSchema.extend({
    action: zod.z.literal('create'),
    collectionName: zod.z.string().regex(common.COLLECTION_NAME_REGEX).optional(),
    singularName: zod.z.string().min(1).regex(common.KEBAB_BASE_REGEX, 'Must be kebab case').refine((value)=>!builder.isReservedModelName(value), 'Model name is reserved'),
    pluralName: zod.z.string().min(1).regex(common.KEBAB_BASE_REGEX, 'Must be kebab case').refine((value)=>!builder.isReservedModelName(value), 'Model name is reserved'),
    config: zod.z.record(zod.z.string(), zod.z.unknown()).optional()
});
const createSingleTypeSchema = baseCreateContentTypeSchema.extend({
    kind: zod.z.literal(constants.typeKinds.SINGLE_TYPE),
    attributes: zod.z.array(createAttributeSchema({
        modelType: 'contentType',
        kind: 'singleType'
    })).superRefine(uniqueAttributeName).superRefine(verifyUidTargetField)
});
const createCollectionTypeSchema = baseCreateContentTypeSchema.extend({
    kind: zod.z.literal(constants.typeKinds.COLLECTION_TYPE),
    attributes: zod.z.array(createAttributeSchema({
        modelType: 'contentType',
        kind: 'collectionType'
    })).superRefine(uniqueAttributeName).superRefine(verifyUidTargetField)
});
const baseUpdateContentTypeSchema = baseContentTypeSchema.extend({
    action: zod.z.literal('update')
});
const updateSingleTypeSchema = baseUpdateContentTypeSchema.extend({
    kind: zod.z.literal(constants.typeKinds.SINGLE_TYPE).optional(),
    attributes: zod.z.array(zod.z.discriminatedUnion('action', [
        createAttributeSchema({
            modelType: 'contentType',
            kind: 'singleType'
        }),
        updateAttributeSchema({
            modelType: 'contentType',
            kind: 'singleType'
        }),
        deleteAttributeSchema
    ])).superRefine(uniqueAttributeName).superRefine(verifyUidTargetField)
});
const updateCollectionTypeSchema = baseUpdateContentTypeSchema.extend({
    kind: zod.z.literal(constants.typeKinds.COLLECTION_TYPE).optional(),
    attributes: zod.z.array(zod.z.union([
        createAttributeSchema({
            modelType: 'contentType',
            kind: 'collectionType'
        }),
        updateAttributeSchema({
            modelType: 'contentType',
            kind: 'collectionType'
        }),
        deleteAttributeSchema
    ])).superRefine(uniqueAttributeName).superRefine(verifyUidTargetField)
});
const deleteContentTypeSchema = zod.z.object({
    action: zod.z.literal('delete'),
    uid: contentTypeUIDSchema
});
const schemaSchema = zod.z.object({
    components: zod.z.array(zod.z.union([
        createComponentSchema,
        updateComponentSchema,
        deleteComponentSchema
    ])).optional().default([]),
    contentTypes: zod.z.array(zod.z.union([
        createSingleTypeSchema,
        createCollectionTypeSchema,
        updateSingleTypeSchema,
        updateCollectionTypeSchema,
        deleteContentTypeSchema
    ]).superRefine(verifySingularAndPluralNames)).optional().default([])
});
const validateUpdateSchema = utils.validateZod(zod.z.object({
    data: schemaSchema
}, {
    invalid_type_error: 'Invalid schema, expected an object with a data property',
    required_error: 'Schema is required'
}));

exports.maxGreaterThanMin = maxGreaterThanMin;
exports.maxLengthGreaterThanMinLength = maxLengthGreaterThanMinLength;
exports.validateUpdateSchema = validateUpdateSchema;
//# sourceMappingURL=schema.js.map
