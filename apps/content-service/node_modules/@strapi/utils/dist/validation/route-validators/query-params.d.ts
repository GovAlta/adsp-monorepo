import * as z from 'zod/v4';
/**
 * Standard query parameter validators that can be reused across different route validators
 *
 * These schemas provide the basic structure validation for common Strapi API query parameters.
 * They can be used as building blocks for both generic validation and schema-aware validation.
 */
/**
 * Fields parameter validation
 * Supports: 'title', ['title', 'name'], or '*'
 */
export declare const queryFieldsSchema: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
/**
 * Populate parameter validation
 * Supports: '*', 'relation', ['relation1', 'relation2'], or complex objects
 */
export declare const queryPopulateSchema: z.ZodUnion<readonly [z.ZodLiteral<"*">, z.ZodString, z.ZodArray<z.ZodString>, z.ZodRecord<z.ZodString, z.ZodAny>]>;
/**
 * Sort parameter validation
 * Supports: 'name', ['name', 'title'], { name: 'asc' }, or [{ name: 'desc' }]
 */
export declare const querySortSchema: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>, z.ZodRecord<z.ZodString, z.ZodEnum<{
    asc: "asc";
    desc: "desc";
}>>, z.ZodArray<z.ZodRecord<z.ZodString, z.ZodEnum<{
    asc: "asc";
    desc: "desc";
}>>>]>;
/**
 * Pagination parameter validation
 * Supports both page-based and offset-based pagination
 */
export declare const paginationSchema: z.ZodIntersection<z.ZodObject<{
    withCount: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodUnion<readonly [z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    start: z.ZodNumber;
    limit: z.ZodNumber;
}, z.core.$strip>]>>;
/**
 * Filters parameter validation
 * Supports any object structure for filtering
 */
export declare const filtersSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
/**
 * Locale parameter validation
 * Used for internationalization
 */
export declare const localeSchema: z.ZodString;
/**
 * Status parameter validation
 * Used for draft & publish functionality
 */
export declare const statusSchema: z.ZodEnum<{
    draft: "draft";
    published: "published";
}>;
/**
 * Search query parameter validation
 * Used for text search functionality
 */
export declare const searchQuerySchema: z.ZodString;
/**
 * Complete collection of all standard query parameter schemas
 * This object provides easy access to all available query parameter validators
 */
export declare const queryParameterSchemas: {
    readonly fields: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    readonly populate: z.ZodUnion<readonly [z.ZodLiteral<"*">, z.ZodString, z.ZodArray<z.ZodString>, z.ZodRecord<z.ZodString, z.ZodAny>]>;
    readonly sort: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>, z.ZodRecord<z.ZodString, z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>, z.ZodArray<z.ZodRecord<z.ZodString, z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>>]>;
    readonly pagination: z.ZodIntersection<z.ZodObject<{
        withCount: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>, z.ZodUnion<readonly [z.ZodObject<{
        page: z.ZodNumber;
        pageSize: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        start: z.ZodNumber;
        limit: z.ZodNumber;
    }, z.core.$strip>]>>;
    readonly filters: z.ZodRecord<z.ZodString, z.ZodAny>;
    readonly locale: z.ZodString;
    readonly status: z.ZodEnum<{
        draft: "draft";
        published: "published";
    }>;
    readonly _q: z.ZodString;
};
/**
 * Query parameter names supported by Strapi's API
 */
export type QueryParam = keyof typeof queryParameterSchemas;
//# sourceMappingURL=query-params.d.ts.map