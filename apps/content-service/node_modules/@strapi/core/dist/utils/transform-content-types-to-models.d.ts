import { type Model, type Identifiers } from '@strapi/database';
import type { Struct, Schema } from '@strapi/types';
import { createId } from '@paralleldrive/cuid2';
/**
 * Because strapi/database models don't know about things like components or dynamic zones, we use this file to convert them
 * to a relations format that it recognizes
 *
 * Therefore we have to keep an additional set of helpers/extensions to the database naming methods
 *
 * IMPORTANT!
 * If we use short versions of anything, we MUST call getNameFromTokens directly; attempting to shorten them ourselves
 * prevents the unshortened name map from being filled properly, so for example it will think that the short name
 * 'collection4f3a_cmps' maps to the unshortened 'collectionname_cmps' rather than 'collectionname_components'
 * Therefore, we only use the identifiers helpers in cases where we do not do any of our own shortening
 */
export declare const getComponentJoinTableName: (collectionName: string, identifiers: Identifiers) => string;
export declare const getDzJoinTableName: (collectionName: string, identifiers: Identifiers) => string;
export declare const getComponentJoinColumnEntityName: (identifiers: Identifiers) => string;
export declare const getComponentJoinColumnInverseName: (identifiers: Identifiers) => string;
export declare const getComponentTypeColumn: (identifiers: Identifiers) => string;
export declare const getComponentFkIndexName: (contentType: string, identifiers: Identifiers) => string;
export type LoadedContentTypeModel = Struct.ContentTypeSchema & Required<Pick<Struct.ContentTypeSchema, 'collectionName' | 'uid' | 'modelName'>> & Pick<Model, 'lifecycles'>;
export declare const transformAttribute: (name: string, attribute: Schema.Attribute.AnyAttribute, contentType: LoadedContentTypeModel, identifiers: Identifiers) => {
    type: "biginteger";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    default?: string | (() => string) | undefined;
    min?: string | undefined;
    max?: string | undefined;
    private?: boolean | undefined;
    required?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    unique?: boolean | undefined;
} | {
    type: "boolean";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    default?: boolean | (() => boolean) | undefined;
    private?: boolean | undefined;
    required?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
} | {
    type: "blocks";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    private?: boolean | undefined;
    required?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
} | {
    type: "datetime";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    default?: Schema.Attribute.DateTimeValue | (() => Schema.Attribute.DateTimeValue) | undefined;
    private?: boolean | undefined;
    required?: boolean | undefined;
    unique?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
} | {
    type: "date";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    default?: Schema.Attribute.DateValue | (() => Schema.Attribute.DateValue) | undefined;
    private?: boolean | undefined;
    required?: boolean | undefined;
    unique?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
} | {
    type: "decimal";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    default?: number | (() => number) | undefined;
    min?: number | undefined;
    max?: number | undefined;
    private?: boolean | undefined;
    required?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    unique?: boolean | undefined;
} | {
    type: "email";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    default?: string | (() => string) | undefined;
    minLength?: number | undefined;
    maxLength?: number | undefined;
    private?: boolean | undefined;
    required?: boolean | undefined;
    unique?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
} | {
    type: "enumeration";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    enum: string[];
    enumName?: string | undefined;
    configurable?: boolean | undefined;
    default?: string | (() => string) | undefined;
    private?: boolean | undefined;
    required?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
} | {
    type: "float";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    default?: number | (() => number) | undefined;
    min?: number | undefined;
    max?: number | undefined;
    private?: boolean | undefined;
    required?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    unique?: boolean | undefined;
} | {
    type: "integer";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    default?: number | (() => number) | undefined;
    min?: number | undefined;
    max?: number | undefined;
    private?: boolean | undefined;
    required?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    unique?: boolean | undefined;
} | {
    type: "json";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    required?: boolean | undefined;
    private?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    default?: import("@strapi/types/dist/utils").JSONPrimitive | (() => import("@strapi/types/dist/utils").JSONPrimitive) | undefined;
} | {
    type: "password";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    default?: string | (() => string) | undefined;
    minLength?: number | undefined;
    maxLength?: number | undefined;
    private?: boolean | undefined;
    required?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
} | {
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    private?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "morphToOne";
} | {
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    private?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "morphToMany";
} | {
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    target: import("@strapi/types/dist/uid").ContentType;
    inversedBy?: string | undefined;
    mappedBy?: string | undefined;
    configurable?: boolean | undefined;
    private?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "oneToOne";
} | {
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    target: import("@strapi/types/dist/uid").ContentType;
    inversedBy?: string | undefined;
    mappedBy?: string | undefined;
    configurable?: boolean | undefined;
    private?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "oneToMany";
} | {
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    target: import("@strapi/types/dist/uid").ContentType;
    inversedBy?: string | undefined;
    mappedBy?: string | undefined;
    configurable?: boolean | undefined;
    private?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "manyToOne";
} | {
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    target: import("@strapi/types/dist/uid").ContentType;
    inversedBy?: string | undefined;
    mappedBy?: string | undefined;
    configurable?: boolean | undefined;
    private?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "manyToMany";
} | {
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    target: import("@strapi/types/dist/uid").ContentType;
    configurable?: boolean | undefined;
    private?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "oneWay";
} | {
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    target: import("@strapi/types/dist/uid").ContentType;
    configurable?: boolean | undefined;
    private?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "manyWay";
} | {
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    target: import("@strapi/types/dist/uid").ContentType;
    morphBy?: string | undefined;
    configurable?: boolean | undefined;
    private?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "morphOne";
} | {
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    target: import("@strapi/types/dist/uid").ContentType;
    morphBy?: string | undefined;
    configurable?: boolean | undefined;
    private?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "morphMany";
} | {
    type: "richtext";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    default?: string | (() => string) | undefined;
    minLength?: number | undefined;
    maxLength?: number | undefined;
    private?: boolean | undefined;
    required?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
} | {
    type: "string";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    regex?: RegExp | undefined;
    configurable?: boolean | undefined;
    default?: string | (() => string) | undefined;
    minLength?: number | undefined;
    maxLength?: number | undefined;
    private?: boolean | undefined;
    unique?: boolean | undefined;
    required?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
} | {
    type: "text";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    regex?: RegExp | undefined;
    configurable?: boolean | undefined;
    default?: string | (() => string) | undefined;
    minLength?: number | undefined;
    maxLength?: number | undefined;
    private?: boolean | undefined;
    unique?: boolean | undefined;
    required?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
} | {
    type: "time";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    default?: Schema.Attribute.TimeValue | (() => Schema.Attribute.TimeValue) | undefined;
    private?: boolean | undefined;
    required?: boolean | undefined;
    unique?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
} | {
    type: "timestamp";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    default?: Schema.Attribute.TimestampValue | (() => Schema.Attribute.TimestampValue) | undefined;
    private?: boolean | undefined;
    required?: boolean | undefined;
    unique?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
} | {
    type: "uid";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    targetField?: string | undefined;
    options?: Schema.Attribute.UIDOptions | undefined;
    regex?: string | undefined;
    configurable?: boolean | undefined;
    default?: string | (() => string) | undefined;
    minLength?: number | undefined;
    maxLength?: number | undefined;
    private?: boolean | undefined;
    required?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
} | {
    type: string;
    relation: string;
    target: string;
    morphBy: string;
    joinTable?: undefined;
} | {
    type: string;
    relation: string;
    target: `${string}.${string}`;
    joinTable: {
        name: string;
        joinColumn: {
            name: string;
            referencedColumn: "id";
        };
        inverseJoinColumn: {
            name: string;
            referencedColumn: "id";
        };
        on: {
            field: string;
        };
        orderColumnName: "order";
        orderBy: {
            order: string;
        };
        pivotColumns: string[];
        morphColumn?: undefined;
    };
    morphBy?: undefined;
} | {
    type: string;
    relation: string;
    joinTable: {
        name: string;
        joinColumn: {
            name: string;
            referencedColumn: "id";
        };
        morphColumn: {
            idColumn: {
                name: string;
                referencedColumn: "id";
            };
            typeColumn: {
                name: string;
            };
            typeField: string;
        };
        on: {
            field: string;
        };
        orderBy: {
            order: string;
        };
        pivotColumns: string[];
        inverseJoinColumn?: undefined;
        orderColumnName?: undefined;
    };
    target?: undefined;
    morphBy?: undefined;
};
export declare const transformAttributes: (contentType: LoadedContentTypeModel, identifiers: Identifiers) => {};
export declare const hasComponentsOrDz: (contentType: LoadedContentTypeModel) => contentType is Struct.ContentTypeSchema & Required<Pick<Struct.ContentTypeSchema, "uid" | "collectionName" | "modelName">> & Pick<Model, "lifecycles"> & {
    type: 'dynamiczone' | 'component';
};
export declare const createDocumentId: typeof createId;
export declare const transformContentTypesToModels: (contentTypes: LoadedContentTypeModel[], identifiers: Identifiers) => Model[];
//# sourceMappingURL=transform-content-types-to-models.d.ts.map