import type { Core } from '@strapi/types';
export declare const getVisibleContentTypesUID: (...args: any[]) => any;
export declare const hasStageAttribute: import("lodash/fp").LodashHas1x1;
export declare const getWorkflowContentTypeFilter: ({ strapi }: {
    strapi: Core.Strapi;
}, contentType: any) => {
    $jsonSupersetOf: string;
    $contains?: undefined;
} | {
    $contains: string;
    $jsonSupersetOf?: undefined;
};
export declare const clampMaxWorkflows: import("lodash/fp").LodashClamp1x3;
export declare const clampMaxStagesPerWorkflow: import("lodash/fp").LodashClamp1x3;
declare const _default: {
    clampMaxWorkflows: import("lodash/fp").LodashClamp1x3;
    clampMaxStagesPerWorkflow: import("lodash/fp").LodashClamp1x3;
    getVisibleContentTypesUID: (...args: any[]) => any;
    hasStageAttribute: import("lodash/fp").LodashHas1x1;
    getWorkflowContentTypeFilter: ({ strapi }: {
        strapi: Core.Strapi;
    }, contentType: any) => {
        $jsonSupersetOf: string;
        $contains?: undefined;
    } | {
        $contains: string;
        $jsonSupersetOf?: undefined;
    };
};
export default _default;
//# sourceMappingURL=review-workflows.d.ts.map