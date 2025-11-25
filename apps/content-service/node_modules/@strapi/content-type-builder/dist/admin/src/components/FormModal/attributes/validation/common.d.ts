import * as yup from 'yup';
declare const NAME_REGEX: RegExp;
declare const alreadyUsedAttributeNames: (usedNames: Array<string>) => yup.TestConfig<string | undefined, Record<string, unknown>>;
declare const getUsedContentTypeAttributeNames: (ctShema: any, isEdition: boolean, attributeNameToEdit: string) => string[];
declare const isNameAllowed: (reservedNames: Array<string>) => yup.TestConfig<string | undefined, Record<string, unknown>>;
declare const validators: {
    default: () => yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
    max: () => yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    min: () => yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    maxLength: () => yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    minLength: () => yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    name(usedNames: Array<string>, reservedNames: Array<string>): import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    required: () => yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
    type: () => import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    unique: () => yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
};
declare const createTextShape: (usedAttributeNames: Array<string>, reservedNames: Array<string>) => {
    name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
    unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
    required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
    maxLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    minLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    regex: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
};
type GenericIsMinSuperiorThanMax<T extends (string | null) | number> = yup.TestConfig<T | undefined, Record<string, unknown>>;
declare const isMinSuperiorThanMax: <T extends string | number | null>() => GenericIsMinSuperiorThanMax<T>;
export { alreadyUsedAttributeNames, createTextShape, getUsedContentTypeAttributeNames, isMinSuperiorThanMax, isNameAllowed, NAME_REGEX, validators, };
