import type { Core } from '@strapi/types';
import * as z from 'zod/v4';
/**
 * A validator for i18n locale routes.
 *
 */
export declare class I18nLocaleRouteValidator {
    protected readonly _strapi: Core.Strapi;
    constructor(strapi: Core.Strapi);
    /**
     * Generates a validation schema for a single locale.
     *
     * @returns A schema for validating locale objects
     */
    get locale(): z.ZodObject<{
        id: z.ZodNumber;
        documentId: z.ZodString;
        name: z.ZodString;
        code: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        publishedAt: z.ZodNullable<z.ZodString>;
        isDefault: z.ZodBoolean;
    }, z.core.$strip>;
    /**
     * Generates a validation schema for an array of locales
     *
     * @returns A schema for validating arrays of locales
     */
    get locales(): z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        documentId: z.ZodString;
        name: z.ZodString;
        code: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        publishedAt: z.ZodNullable<z.ZodString>;
        isDefault: z.ZodBoolean;
    }, z.core.$strip>>;
}
//# sourceMappingURL=locale.d.ts.map