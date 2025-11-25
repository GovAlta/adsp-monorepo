import * as z from 'zod/v4';
import { type QueryParam } from './query-params';
/**
 * AbstractRouteValidator provides the foundation for validating routes.
 *
 * This abstract class provides common query parameter validators that can be reused
 * across different route validators in Strapi. It serves as a building block for
 * both generic validation (plugins, external packages) and schema-aware validation
 * (core content types).
 */
export declare abstract class AbstractRouteValidator {
    /**
     * Creates a fields query parameter validator
     * Validates field selection for API responses
     */
    get queryFields(): z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    /**
     * Creates a populate query parameter validator
     * Validates which relations to populate in the response
     */
    get queryPopulate(): z.ZodUnion<readonly [z.ZodLiteral<"*">, z.ZodString, z.ZodArray<z.ZodString>, z.ZodRecord<z.ZodString, z.ZodAny>]>;
    /**
     * Creates a sort query parameter validator
     * Validates sorting options for list endpoints
     */
    get querySort(): z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>, z.ZodRecord<z.ZodString, z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>, z.ZodArray<z.ZodRecord<z.ZodString, z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>>]>;
    /**
     * Creates a pagination query parameter validator
     * Supports both page-based and offset-based pagination
     */
    get pagination(): z.ZodIntersection<z.ZodObject<{
        withCount: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>, z.ZodUnion<readonly [z.ZodObject<{
        page: z.ZodNumber;
        pageSize: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        start: z.ZodNumber;
        limit: z.ZodNumber;
    }, z.core.$strip>]>>;
    /**
     * Creates a filters query parameter validator
     * Validates filtering options for list endpoints
     */
    get filters(): z.ZodRecord<z.ZodString, z.ZodAny>;
    /**
     * Creates a locale query parameter validator
     * Used for internationalization
     */
    get locale(): z.ZodString;
    /**
     * Creates a status query parameter validator
     * Used for draft & publish functionality
     */
    get status(): z.ZodEnum<{
        draft: "draft";
        published: "published";
    }>;
    /**
     * Creates a search query parameter validator
     * Used for text search functionality
     */
    get query(): z.ZodString;
    /**
     * Provides access to all base query parameter validators
     */
    protected get baseQueryValidators(): {
        fields: () => z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
        populate: () => z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"*">, z.ZodString, z.ZodArray<z.ZodString>, z.ZodRecord<z.ZodString, z.ZodAny>]>>;
        sort: () => z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>, z.ZodRecord<z.ZodString, z.ZodEnum<{
            asc: "asc";
            desc: "desc";
        }>>, z.ZodArray<z.ZodRecord<z.ZodString, z.ZodEnum<{
            asc: "asc";
            desc: "desc";
        }>>>]>>;
        filters: () => z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        pagination: () => z.ZodOptional<z.ZodIntersection<z.ZodObject<{
            withCount: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>, z.ZodUnion<readonly [z.ZodObject<{
            page: z.ZodNumber;
            pageSize: z.ZodNumber;
        }, z.core.$strip>, z.ZodObject<{
            start: z.ZodNumber;
            limit: z.ZodNumber;
        }, z.core.$strip>]>>>;
        locale: () => z.ZodOptional<z.ZodString>;
        status: () => z.ZodOptional<z.ZodEnum<{
            draft: "draft";
            published: "published";
        }>>;
        _q: () => z.ZodOptional<z.ZodString>;
    };
    /**
     * Helper method to create a query parameters object with specified validators
     *
     * @param params - Array of query parameter names to include
     * @returns Object containing Zod schemas for the requested query parameters
     */
    queryParams(params: QueryParam[]): Record<string, z.ZodSchema>;
}
//# sourceMappingURL=base.d.ts.map