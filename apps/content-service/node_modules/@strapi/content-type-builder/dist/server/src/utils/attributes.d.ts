import type { Schema } from '@strapi/types';
export declare const isConfigurable: (attribute: Schema.Attribute.AnyAttribute) => boolean;
export declare const isRelation: (attribute: Schema.Attribute.AnyAttribute) => boolean;
/**
 * Formats a component's attributes
 */
export declare const formatAttributes: (model: any) => any;
/**
 * Formats a component attribute
 */
export declare const formatAttribute: (attribute: Schema.Attribute.AnyAttribute & Record<string, any>) => ({
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
} & Record<string, any>) | ({
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
} & Record<string, any>) | ({
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
} & Record<string, any>) | ({
    type: "component";
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
    component: `${string}.${string}`;
    repeatable?: boolean | undefined;
    configurable?: boolean | undefined;
    min?: number | undefined;
    max?: number | undefined;
    private?: boolean | undefined;
    required?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
} & Record<string, any>) | ({
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
} & Record<string, any>) | ({
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
} & Record<string, any>) | ({
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
} & Record<string, any>) | ({
    type: "dynamiczone";
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
    components: `${string}.${string}`[];
    configurable?: boolean | undefined;
    min?: number | undefined;
    max?: number | undefined;
    required?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
} & Record<string, any>) | ({
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
} & Record<string, any>) | ({
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
} & Record<string, any>) | ({
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
} & Record<string, any>) | ({
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
} & Record<string, any>) | ({
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
} & Record<string, any>) | ({
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
} & Record<string, any>) | ({
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
} & Record<string, any>) | ({
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
} & Record<string, any>) | ({
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
} & Record<string, any>) | ({
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
} & Record<string, any>) | ({
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
} & Record<string, any>) | ({
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
} & Record<string, any>) | {
    type: string;
    multiple: boolean;
    required: boolean;
    configurable: boolean | undefined;
    private: boolean;
    allowedTypes: Schema.Attribute.MediaKind | (Schema.Attribute.MediaKind | undefined)[] | undefined;
    pluginOptions: object | undefined;
} | {
    type: string;
    target: any;
    targetAttribute: any;
    configurable: boolean | undefined;
    private: boolean;
    pluginOptions: object | undefined;
    autoPopulate: any;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "morphToOne";
    multiple?: undefined;
    allowedTypes?: undefined;
} | {
    type: string;
    target: any;
    targetAttribute: any;
    configurable: boolean | undefined;
    private: boolean;
    pluginOptions: object | undefined;
    autoPopulate: any;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "morphToMany";
    multiple?: undefined;
    allowedTypes?: undefined;
} | {
    type: string;
    target: any;
    targetAttribute: any;
    configurable: boolean | undefined;
    private: boolean;
    pluginOptions: object | undefined;
    autoPopulate: any;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    inversedBy?: string | undefined;
    mappedBy?: string | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "oneToOne";
    multiple?: undefined;
    allowedTypes?: undefined;
} | {
    type: string;
    target: any;
    targetAttribute: any;
    configurable: boolean | undefined;
    private: boolean;
    pluginOptions: object | undefined;
    autoPopulate: any;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    inversedBy?: string | undefined;
    mappedBy?: string | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "oneToMany";
    multiple?: undefined;
    allowedTypes?: undefined;
} | {
    type: string;
    target: any;
    targetAttribute: any;
    configurable: boolean | undefined;
    private: boolean;
    pluginOptions: object | undefined;
    autoPopulate: any;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    inversedBy?: string | undefined;
    mappedBy?: string | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "manyToOne";
    multiple?: undefined;
    allowedTypes?: undefined;
} | {
    type: string;
    target: any;
    targetAttribute: any;
    configurable: boolean | undefined;
    private: boolean;
    pluginOptions: object | undefined;
    autoPopulate: any;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    inversedBy?: string | undefined;
    mappedBy?: string | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "manyToMany";
    multiple?: undefined;
    allowedTypes?: undefined;
} | {
    type: string;
    target: any;
    targetAttribute: any;
    configurable: boolean | undefined;
    private: boolean;
    pluginOptions: object | undefined;
    autoPopulate: any;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "oneWay";
    multiple?: undefined;
    allowedTypes?: undefined;
} | {
    type: string;
    target: any;
    targetAttribute: any;
    configurable: boolean | undefined;
    private: boolean;
    pluginOptions: object | undefined;
    autoPopulate: any;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "manyWay";
    multiple?: undefined;
    allowedTypes?: undefined;
} | {
    type: string;
    target: any;
    targetAttribute: any;
    configurable: boolean | undefined;
    private: boolean;
    pluginOptions: object | undefined;
    autoPopulate: any;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    morphBy?: string | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "morphOne";
    multiple?: undefined;
    allowedTypes?: undefined;
} | {
    type: string;
    target: any;
    targetAttribute: any;
    configurable: boolean | undefined;
    private: boolean;
    pluginOptions: object | undefined;
    autoPopulate: any;
    searchable?: boolean | undefined;
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    morphBy?: string | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "morphMany";
    multiple?: undefined;
    allowedTypes?: undefined;
};
export declare const replaceTemporaryUIDs: (uidMap: any) => (schema: any) => any;
//# sourceMappingURL=attributes.d.ts.map