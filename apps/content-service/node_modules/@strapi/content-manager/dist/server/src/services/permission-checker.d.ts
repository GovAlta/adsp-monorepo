import type { Core } from '@strapi/types';
type Query = {
    page?: string;
    pageSize?: string;
    sort?: string;
};
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    create: ({ userAbility, model }: {
        userAbility: any;
        model: string;
    }) => {
        can: (action: string, entity?: ({
            id: import("@strapi/types/dist/data").ID;
        } & {
            [key: string]: any;
        }) | undefined, field: string) => any;
        cannot: (action: string, entity?: ({
            id: import("@strapi/types/dist/data").ID;
        } & {
            [key: string]: any;
        }) | undefined, field: string) => any;
        sanitizeOutput: (data: {
            id: import("@strapi/types/dist/data").ID;
        } & {
            [key: string]: any;
        }, { action }?: {
            action?: string | undefined;
        }) => any;
        sanitizeQuery: (query: Query, { action }?: {
            action?: string | undefined;
        }) => any;
        sanitizeCreateInput: (data: any) => any;
        sanitizeUpdateInput: (entity: {
            id: import("@strapi/types/dist/data").ID;
        } & {
            [key: string]: any;
        }) => (data: any) => any;
        validateQuery: (query: Query, { action }?: {
            action?: string | undefined;
        }) => any;
        validateInput: (action: string, data: any, entity?: ({
            id: import("@strapi/types/dist/data").ID;
        } & {
            [key: string]: any;
        }) | undefined) => any;
        sanitizedQuery: (query: Query, action?: {
            action?: string | undefined;
        }) => Promise<any>;
    };
};
export default _default;
//# sourceMappingURL=permission-checker.d.ts.map