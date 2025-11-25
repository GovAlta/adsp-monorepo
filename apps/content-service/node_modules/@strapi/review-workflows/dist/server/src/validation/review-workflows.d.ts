import { yup } from '@strapi/utils';
export declare const validateWorkflowCreate: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    stages: any;
    contentTypes: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined, (string | undefined)[] | undefined>;
    stageRequiredToPublishName: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
}>>>;
export declare const validateUpdateStageOnEntity: (body: unknown, errorMessage?: string | undefined) => Promise<any>;
export declare const validateUpdateAssigneeOnEntity: (body: unknown, errorMessage?: string | undefined) => Promise<any>;
export declare const validateWorkflowUpdate: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    name: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    stages: any;
    contentTypes: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined, (string | undefined)[] | undefined>;
    stageRequiredToPublishName: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
}>>>;
export declare const validateLocale: (body: unknown, errorMessage?: string | undefined) => Promise<string | null | undefined>;
declare const _default: {
    validateWorkflowCreate: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        stages: any;
        contentTypes: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined, (string | undefined)[] | undefined>;
        stageRequiredToPublishName: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>>>;
    validateUpdateStageOnEntity: (body: unknown, errorMessage?: string | undefined) => Promise<any>;
    validateUpdateAssigneeOnEntity: (body: unknown, errorMessage?: string | undefined) => Promise<any>;
    validateWorkflowUpdate: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        name: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
        stages: any;
        contentTypes: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined, (string | undefined)[] | undefined>;
        stageRequiredToPublishName: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>>>;
    validateLocale: (body: unknown, errorMessage?: string | undefined) => Promise<string | null | undefined>;
};
export default _default;
//# sourceMappingURL=review-workflows.d.ts.map