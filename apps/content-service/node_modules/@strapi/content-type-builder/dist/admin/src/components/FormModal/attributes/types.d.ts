import * as yup from 'yup';
import type { Schema } from '@strapi/types';
export declare const attributeTypes: {
    date(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    }>>;
    datetime(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    }>>;
    time(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    }>>;
    default(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    }>>;
    biginteger(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        max: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        min: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        max: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        min: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>>;
    boolean(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
    }>>;
    component(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        max: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        min: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        component: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        max: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        min: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        component: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    }>>;
    decimal(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        max: yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
        min: yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        max: yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
        min: yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
    }>>;
    dynamiczone(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        max: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        min: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        max: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        min: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    }>>;
    email(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        maxLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        minLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        maxLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        minLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    }>>;
    enumeration(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        enum: yup.ArraySchema<yup.default<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined, (string | undefined)[] | undefined>;
        enumName: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        enum: yup.ArraySchema<yup.default<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined, (string | undefined)[] | undefined>;
        enumName: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>>;
    float(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        default: yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
        max: yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
        min: yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        default: yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
        max: yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
        min: yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
    }>>;
    integer(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        max: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        min: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.NumberSchema<number | undefined, Record<string, any>, number | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        max: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        min: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    }>>;
    json(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
    }>>;
    media(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        multiple: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        allowedTypes: yup.ArraySchema<yup.default<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | null | undefined, (string | undefined)[] | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        multiple: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        allowedTypes: yup.ArraySchema<yup.default<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | null | undefined, (string | undefined)[] | null | undefined>;
    }>>;
    password(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        maxLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        minLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        maxLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        minLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    }>>;
    relation(usedAttributeNames: Array<string>, reservedNames: Array<string>, alreadyTakenTargetAttributes: Array<{
        name: string;
    }>, { initialData, modifiedData, }: {
        initialData: {
            targetAttribute?: string;
        };
        modifiedData: {
            name?: string;
            relation?: Schema.Attribute.RelationKind.WithTarget;
            targetAttribute?: string;
        };
    }): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        target: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        relation: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        targetAttribute: import("yup/lib/Lazy").default<yup.default<string | null | undefined, Record<string, any>, string | null | undefined>, Record<string, any>>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        target: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        relation: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        targetAttribute: import("yup/lib/Lazy").default<yup.default<string | null | undefined, Record<string, any>, string | null | undefined>, Record<string, any>>;
    }>>;
    richtext(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        maxLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        minLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        maxLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        minLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    }>>;
    blocks(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        maxLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        minLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        maxLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        minLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    }>>;
    string(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        maxLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        minLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        regex: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        maxLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        minLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        regex: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>>;
    text(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        maxLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        minLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        regex: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        maxLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        minLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        regex: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>>;
    uid(usedAttributeNames: Array<string>, reservedNames: Array<string>): import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        maxLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        minLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        regex: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        default: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
        unique: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
        required: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
        maxLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        minLength: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
        regex: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>>;
};
