import { yup } from '@strapi/utils';
import type { Schema, Struct, Modules } from '@strapi/types';
import type { ComponentContext } from '.';
export interface ValidatorMetas<TAttribute extends Schema.Attribute.AnyAttribute = Schema.Attribute.AnyAttribute, TValue extends Schema.Attribute.Value<TAttribute> = Schema.Attribute.Value<TAttribute>> {
    attr: TAttribute;
    model: Struct.Schema;
    updatedAttribute: {
        name: string;
        value: TValue;
    };
    data: Record<string, unknown>;
    componentContext?: ComponentContext;
    entity?: Modules.EntityValidator.Entity;
}
interface ValidatorOptions {
    isDraft: boolean;
    locale?: string;
}
export declare const emailValidator: (metas: ValidatorMetas<Schema.Attribute.Email>, options: ValidatorOptions) => import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
export declare const uidValidator: (metas: ValidatorMetas<Schema.Attribute.UID>, options: ValidatorOptions) => import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
export declare const enumerationValidator: ({ attr }: {
    attr: Schema.Attribute.Enumeration;
}) => import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
export declare const integerValidator: (metas: ValidatorMetas<Schema.Attribute.Integer | Schema.Attribute.BigInteger>, options: ValidatorOptions) => yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
export declare const floatValidator: (metas: ValidatorMetas<Schema.Attribute.Decimal | Schema.Attribute.Float>, options: ValidatorOptions) => yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
export declare const bigintegerValidator: (metas: ValidatorMetas<Schema.Attribute.BigInteger>, options: ValidatorOptions) => import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any>;
export declare const datesValidator: (metas: ValidatorMetas<Schema.Attribute.Date | Schema.Attribute.DateTime | Schema.Attribute.Time | Schema.Attribute.Timestamp>, options: ValidatorOptions) => import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any>;
export declare const Validators: {
    string: (metas: ValidatorMetas<Schema.Attribute.String | Schema.Attribute.Text | Schema.Attribute.RichText | Schema.Attribute.Password | Schema.Attribute.Email | Schema.Attribute.UID>, options: ValidatorOptions) => import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    text: (metas: ValidatorMetas<Schema.Attribute.String | Schema.Attribute.Text | Schema.Attribute.RichText | Schema.Attribute.Password | Schema.Attribute.Email | Schema.Attribute.UID>, options: ValidatorOptions) => import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    richtext: (metas: ValidatorMetas<Schema.Attribute.String | Schema.Attribute.Text | Schema.Attribute.RichText | Schema.Attribute.Password | Schema.Attribute.Email | Schema.Attribute.UID>, options: ValidatorOptions) => import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    password: (metas: ValidatorMetas<Schema.Attribute.String | Schema.Attribute.Text | Schema.Attribute.RichText | Schema.Attribute.Password | Schema.Attribute.Email | Schema.Attribute.UID>, options: ValidatorOptions) => import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    email: (metas: ValidatorMetas<Schema.Attribute.Email>, options: ValidatorOptions) => import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    enumeration: ({ attr }: {
        attr: Schema.Attribute.Enumeration;
    }) => import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    boolean: () => yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
    uid: (metas: ValidatorMetas<Schema.Attribute.UID>, options: ValidatorOptions) => import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    json: () => import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any>;
    integer: (metas: ValidatorMetas<Schema.Attribute.Integer | Schema.Attribute.BigInteger>, options: ValidatorOptions) => yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
    biginteger: (metas: ValidatorMetas<Schema.Attribute.BigInteger>, options: ValidatorOptions) => import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any>;
    float: (metas: ValidatorMetas<Schema.Attribute.Decimal | Schema.Attribute.Float>, options: ValidatorOptions) => yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
    decimal: (metas: ValidatorMetas<Schema.Attribute.Decimal | Schema.Attribute.Float>, options: ValidatorOptions) => yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
    date: (metas: ValidatorMetas<Schema.Attribute.Date | Schema.Attribute.DateTime | Schema.Attribute.Time | Schema.Attribute.Timestamp>, options: ValidatorOptions) => import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any>;
    time: (metas: ValidatorMetas<Schema.Attribute.Date | Schema.Attribute.DateTime | Schema.Attribute.Time | Schema.Attribute.Timestamp>, options: ValidatorOptions) => import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any>;
    datetime: (metas: ValidatorMetas<Schema.Attribute.Date | Schema.Attribute.DateTime | Schema.Attribute.Time | Schema.Attribute.Timestamp>, options: ValidatorOptions) => import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any>;
    timestamp: (metas: ValidatorMetas<Schema.Attribute.Date | Schema.Attribute.DateTime | Schema.Attribute.Time | Schema.Attribute.Timestamp>, options: ValidatorOptions) => import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any>;
    blocks: () => yup.ArraySchema<any, import("yup/lib/types").AnyObject, any[] | undefined, any[] | undefined>;
};
export {};
//# sourceMappingURL=validators.d.ts.map