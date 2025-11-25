import { yup } from '@strapi/utils';
import type { Struct } from '@strapi/types';
export declare const VALID_RELATIONS: string[];
export declare const VALID_TYPES: string[];
export declare const componentSchema: any;
export declare const nestedComponentSchema: yup.ArraySchema<any, import("yup/lib/types").AnyObject, any[] | undefined, any[] | undefined>;
export declare const componentInputSchema: import("yup/lib/object").OptionalObjectSchema<{
    component: any;
    components: yup.ArraySchema<any, import("yup/lib/types").AnyObject, any[] | undefined, any[] | undefined>;
}, Record<string, any>, import("yup/lib/object").TypeOfShape<{
    component: any;
    components: yup.ArraySchema<any, import("yup/lib/types").AnyObject, any[] | undefined, any[] | undefined>;
}>>;
export declare const validateComponentInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<{
    component: any;
    components: yup.ArraySchema<any, import("yup/lib/types").AnyObject, any[] | undefined, any[] | undefined>;
}>>;
export declare const validateUpdateComponentInput: (data: {
    component?: Struct.ComponentSchema;
    components?: Struct.ComponentSchema[];
}) => Promise<import("yup/lib/object").AssertsShape<{
    component: any;
    components: yup.ArraySchema<any, import("yup/lib/types").AnyObject, any[] | undefined, any[] | undefined>;
}>>;
//# sourceMappingURL=component.d.ts.map