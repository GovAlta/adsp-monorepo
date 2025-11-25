import { yup } from '@strapi/utils';
import { TestConfig } from 'yup';
export declare const validators: {
    required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
    unique: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
    minLength: yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
    maxLength: yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
};
export declare const NAME_REGEX: RegExp;
export declare const COLLECTION_NAME_REGEX: RegExp;
export declare const CATEGORY_NAME_REGEX: RegExp;
export declare const ICON_REGEX: RegExp;
export declare const UID_REGEX: RegExp;
export declare const KEBAB_BASE_REGEX: RegExp;
export type CommonTestConfig = TestConfig<unknown | undefined, Record<string, unknown>>;
export declare const isValidName: CommonTestConfig;
export declare const isValidIcon: CommonTestConfig;
export declare const isValidUID: CommonTestConfig;
export declare const isValidCategoryName: CommonTestConfig;
export declare const isValidCollectionName: CommonTestConfig;
export declare const isValidKey: (key: string) => CommonTestConfig;
export declare const isValidEnum: CommonTestConfig;
export declare const areEnumValuesUnique: CommonTestConfig;
export declare const isValidRegExpPattern: CommonTestConfig;
export declare const isValidDefaultJSON: CommonTestConfig;
//# sourceMappingURL=common.d.ts.map