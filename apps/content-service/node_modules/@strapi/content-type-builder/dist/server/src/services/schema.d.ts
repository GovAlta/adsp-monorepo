import type { Schema } from '@strapi/types';
import type { Schema as CTBSchema } from '../controllers/validation/schema';
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
    type: "media";
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
    allowedTypes?: Schema.Attribute.MediaKind | (Schema.Attribute.MediaKind | undefined)[] | undefined;
    multiple?: boolean | undefined;
    configurable?: boolean | undefined;
    required?: boolean | undefined;
    private?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
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
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    targetAttribute: any;
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    private?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "morphToOne";
} | {
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    targetAttribute: any;
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
    column?: Partial<Schema.Attribute.Column> | undefined;
    configurable?: boolean | undefined;
    private?: boolean | undefined;
    writable?: boolean | undefined;
    visible?: boolean | undefined;
    required?: boolean | undefined;
    useJoinTable?: boolean | undefined;
    relation: "morphToMany";
} | {
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    targetAttribute: any;
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
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
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    targetAttribute: any;
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
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
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    targetAttribute: any;
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
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
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    targetAttribute: any;
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
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
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    targetAttribute: any;
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
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
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    targetAttribute: any;
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
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
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    targetAttribute: any;
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
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
    conditions?: {
        visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
        } | {
            in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
        } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
    } | undefined;
    targetAttribute: any;
    type: "relation";
    pluginOptions?: object | undefined;
    searchable?: boolean | undefined;
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
};
export declare const getSchema: () => Promise<{
    contentTypes: {
        [x: `admin::${string}`]: {
            uid: import("@strapi/types/dist/uid").ContentType;
            modelName: string;
            kind: import("@strapi/types/dist/struct").ContentTypeKind;
            globalId: string;
            options: import("@strapi/types/dist/struct").SchemaOptions | undefined;
            pluginOptions: import("@strapi/types/dist/struct").SchemaPluginOptions | undefined;
            plugin: string | undefined;
            collectionName: string | undefined;
            info: import("@strapi/types/dist/struct").ContentTypeSchemaInfo;
            modelType: "contentType";
            attributes: ({
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
            } | {
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
            } | {
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
                type: "media";
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
                allowedTypes?: Schema.Attribute.MediaKind | (Schema.Attribute.MediaKind | undefined)[] | undefined;
                multiple?: boolean | undefined;
                configurable?: boolean | undefined;
                required?: boolean | undefined;
                private?: boolean | undefined;
                writable?: boolean | undefined;
                visible?: boolean | undefined;
            } | {
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
                column?: Partial<Schema.Attribute.Column> | undefined;
                configurable?: boolean | undefined;
                private?: boolean | undefined;
                writable?: boolean | undefined;
                visible?: boolean | undefined;
                required?: boolean | undefined;
                useJoinTable?: boolean | undefined;
                relation: "morphToOne";
            } | {
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
                column?: Partial<Schema.Attribute.Column> | undefined;
                configurable?: boolean | undefined;
                private?: boolean | undefined;
                writable?: boolean | undefined;
                visible?: boolean | undefined;
                required?: boolean | undefined;
                useJoinTable?: boolean | undefined;
                relation: "morphToMany";
            } | {
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
            })[];
            visible: boolean;
            restrictRelationsTo: string[] | null;
        };
        [x: `api::${string}.${string}`]: {
            uid: import("@strapi/types/dist/uid").ContentType;
            modelName: string;
            kind: import("@strapi/types/dist/struct").ContentTypeKind;
            globalId: string;
            options: import("@strapi/types/dist/struct").SchemaOptions | undefined;
            pluginOptions: import("@strapi/types/dist/struct").SchemaPluginOptions | undefined;
            plugin: string | undefined;
            collectionName: string | undefined;
            info: import("@strapi/types/dist/struct").ContentTypeSchemaInfo;
            modelType: "contentType";
            attributes: ({
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
            } | {
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
            } | {
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
                type: "media";
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
                allowedTypes?: Schema.Attribute.MediaKind | (Schema.Attribute.MediaKind | undefined)[] | undefined;
                multiple?: boolean | undefined;
                configurable?: boolean | undefined;
                required?: boolean | undefined;
                private?: boolean | undefined;
                writable?: boolean | undefined;
                visible?: boolean | undefined;
            } | {
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
                column?: Partial<Schema.Attribute.Column> | undefined;
                configurable?: boolean | undefined;
                private?: boolean | undefined;
                writable?: boolean | undefined;
                visible?: boolean | undefined;
                required?: boolean | undefined;
                useJoinTable?: boolean | undefined;
                relation: "morphToOne";
            } | {
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
                column?: Partial<Schema.Attribute.Column> | undefined;
                configurable?: boolean | undefined;
                private?: boolean | undefined;
                writable?: boolean | undefined;
                visible?: boolean | undefined;
                required?: boolean | undefined;
                useJoinTable?: boolean | undefined;
                relation: "morphToMany";
            } | {
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
            })[];
            visible: boolean;
            restrictRelationsTo: string[] | null;
        };
        [x: `plugin::${string}.${string}`]: {
            uid: import("@strapi/types/dist/uid").ContentType;
            modelName: string;
            kind: import("@strapi/types/dist/struct").ContentTypeKind;
            globalId: string;
            options: import("@strapi/types/dist/struct").SchemaOptions | undefined;
            pluginOptions: import("@strapi/types/dist/struct").SchemaPluginOptions | undefined;
            plugin: string | undefined;
            collectionName: string | undefined;
            info: import("@strapi/types/dist/struct").ContentTypeSchemaInfo;
            modelType: "contentType";
            attributes: ({
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
            } | {
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
            } | {
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
                type: "media";
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
                allowedTypes?: Schema.Attribute.MediaKind | (Schema.Attribute.MediaKind | undefined)[] | undefined;
                multiple?: boolean | undefined;
                configurable?: boolean | undefined;
                required?: boolean | undefined;
                private?: boolean | undefined;
                writable?: boolean | undefined;
                visible?: boolean | undefined;
            } | {
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
                column?: Partial<Schema.Attribute.Column> | undefined;
                configurable?: boolean | undefined;
                private?: boolean | undefined;
                writable?: boolean | undefined;
                visible?: boolean | undefined;
                required?: boolean | undefined;
                useJoinTable?: boolean | undefined;
                relation: "morphToOne";
            } | {
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
                column?: Partial<Schema.Attribute.Column> | undefined;
                configurable?: boolean | undefined;
                private?: boolean | undefined;
                writable?: boolean | undefined;
                visible?: boolean | undefined;
                required?: boolean | undefined;
                useJoinTable?: boolean | undefined;
                relation: "morphToMany";
            } | {
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
            })[];
            visible: boolean;
            restrictRelationsTo: string[] | null;
        };
        [x: `strapi::${string}`]: {
            uid: import("@strapi/types/dist/uid").ContentType;
            modelName: string;
            kind: import("@strapi/types/dist/struct").ContentTypeKind;
            globalId: string;
            options: import("@strapi/types/dist/struct").SchemaOptions | undefined;
            pluginOptions: import("@strapi/types/dist/struct").SchemaPluginOptions | undefined;
            plugin: string | undefined;
            collectionName: string | undefined;
            info: import("@strapi/types/dist/struct").ContentTypeSchemaInfo;
            modelType: "contentType";
            attributes: ({
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
            } | {
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
            } | {
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
                type: "media";
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
                allowedTypes?: Schema.Attribute.MediaKind | (Schema.Attribute.MediaKind | undefined)[] | undefined;
                multiple?: boolean | undefined;
                configurable?: boolean | undefined;
                required?: boolean | undefined;
                private?: boolean | undefined;
                writable?: boolean | undefined;
                visible?: boolean | undefined;
            } | {
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
                column?: Partial<Schema.Attribute.Column> | undefined;
                configurable?: boolean | undefined;
                private?: boolean | undefined;
                writable?: boolean | undefined;
                visible?: boolean | undefined;
                required?: boolean | undefined;
                useJoinTable?: boolean | undefined;
                relation: "morphToOne";
            } | {
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
                column?: Partial<Schema.Attribute.Column> | undefined;
                configurable?: boolean | undefined;
                private?: boolean | undefined;
                writable?: boolean | undefined;
                visible?: boolean | undefined;
                required?: boolean | undefined;
                useJoinTable?: boolean | undefined;
                relation: "morphToMany";
            } | {
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
            })[];
            visible: boolean;
            restrictRelationsTo: string[] | null;
        };
    };
    components: {
        [x: `${string}.${string}`]: {
            uid: `${string}.${string}`;
            modelName: string;
            globalId: string;
            modelType: "component";
            collectionName: string | undefined;
            category: string;
            info: import("@strapi/types/dist/struct").SchemaInfo;
            attributes: ({
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
            } | {
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
            } | {
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
                type: "media";
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
                allowedTypes?: Schema.Attribute.MediaKind | (Schema.Attribute.MediaKind | undefined)[] | undefined;
                multiple?: boolean | undefined;
                configurable?: boolean | undefined;
                required?: boolean | undefined;
                private?: boolean | undefined;
                writable?: boolean | undefined;
                visible?: boolean | undefined;
            } | {
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
                column?: Partial<Schema.Attribute.Column> | undefined;
                configurable?: boolean | undefined;
                private?: boolean | undefined;
                writable?: boolean | undefined;
                visible?: boolean | undefined;
                required?: boolean | undefined;
                useJoinTable?: boolean | undefined;
                relation: "morphToOne";
            } | {
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
                column?: Partial<Schema.Attribute.Column> | undefined;
                configurable?: boolean | undefined;
                private?: boolean | undefined;
                writable?: boolean | undefined;
                visible?: boolean | undefined;
                required?: boolean | undefined;
                useJoinTable?: boolean | undefined;
                relation: "morphToMany";
            } | {
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
                name: string;
                conditions?: {
                    visible: string | number | boolean | import("json-logic-js").JsonLogicIf | import("json-logic-js").JsonLogicEqual | import("json-logic-js").JsonLogicStrictEqual | import("json-logic-js").JsonLogicNotEqual | import("json-logic-js").JsonLogicStrictNotEqual | import("json-logic-js").JsonLogicNegation | import("json-logic-js").JsonLogicDoubleNegation | import("json-logic-js").AdditionalOperation | import("json-logic-js").JsonLogicVar<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissing<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMissingSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicOr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAnd<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicGreaterThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThan<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLessThanOrEqual<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMax<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMin<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSum<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicDifference<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicProduct<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicQuotient<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicRemainder<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMap<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicFilter<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicReduce<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicAll<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicNone<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSome<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicMerge<import("json-logic-js").AdditionalOperation> | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>[]];
                    } | {
                        in: [import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>, import("json-logic-js").RulesLogic<import("json-logic-js").AdditionalOperation>];
                    } | import("json-logic-js").JsonLogicCat<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicSubstr<import("json-logic-js").AdditionalOperation> | import("json-logic-js").JsonLogicLog<import("json-logic-js").AdditionalOperation> | null;
                } | undefined;
                targetAttribute: any;
                type: "relation";
                pluginOptions?: object | undefined;
                searchable?: boolean | undefined;
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
            })[];
        };
    };
}>;
export declare const updateSchema: (schema: CTBSchema) => Promise<void>;
//# sourceMappingURL=schema.d.ts.map