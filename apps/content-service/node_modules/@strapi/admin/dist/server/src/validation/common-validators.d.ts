import { yup } from '@strapi/utils';
export declare const email: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
export declare const firstname: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
export declare const lastname: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
export declare const username: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
export declare const password: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
export declare const roles: import("yup/lib/array").OptionalArraySchema<yup.StrapiIDSchema, import("yup/lib/types").AnyObject, any[] | undefined>;
export declare const arrayOfConditionNames: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined, (string | undefined)[] | undefined>;
export declare const permissionsAreEquals: (a: any, b: any) => boolean;
export declare const permission: import("yup").ObjectSchema<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    action: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    actionParameters: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape> | null>;
    subject: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    properties: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
    conditions: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined, (string | undefined)[] | undefined>;
}>, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    action: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    actionParameters: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape> | null>;
    subject: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    properties: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
    conditions: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined, (string | undefined)[] | undefined>;
}>>, import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    action: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    actionParameters: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape> | null>;
    subject: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    properties: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
    conditions: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined, (string | undefined)[] | undefined>;
}>>>;
export declare const updatePermissions: any;
declare const _default: {
    email: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    firstname: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    lastname: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    username: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    password: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    roles: import("yup/lib/array").OptionalArraySchema<yup.StrapiIDSchema, import("yup/lib/types").AnyObject, any[] | undefined>;
    isAPluginName: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    arrayOfConditionNames: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined, (string | undefined)[] | undefined>;
    permission: import("yup").ObjectSchema<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        action: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        actionParameters: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape> | null>;
        subject: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        properties: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
        conditions: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined, (string | undefined)[] | undefined>;
    }>, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        action: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        actionParameters: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape> | null>;
        subject: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        properties: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
        conditions: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined, (string | undefined)[] | undefined>;
    }>>, import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        action: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        actionParameters: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape> | null>;
        subject: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        properties: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
        conditions: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined, (string | undefined)[] | undefined>;
    }>>>;
    updatePermissions: any;
};
export default _default;
//# sourceMappingURL=common-validators.d.ts.map