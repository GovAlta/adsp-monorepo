import type { Core } from '@strapi/types';
import { AbstractRouteValidator, type QueryParam } from '@strapi/utils';
import * as z from 'zod/v4';
export type FileQueryParam = QueryParam;
/**
 * UploadRouteValidator provides validation for upload/file routes.
 *
 * Extends the AbstractRouteValidator to inherit common query parameter validation
 * while adding file-specific validation schemas.
 */
export declare class UploadRouteValidator extends AbstractRouteValidator {
    protected readonly _strapi: Core.Strapi;
    constructor(strapi: Core.Strapi);
    /**
     * File schema for upload responses
     * Defines the structure of a file object returned by the upload API
     */
    get file(): z.ZodObject<{
        id: z.ZodNumber;
        documentId: z.ZodUUID;
        name: z.ZodString;
        alternativeText: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        caption: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        formats: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        hash: z.ZodString;
        ext: z.ZodOptional<z.ZodString>;
        mime: z.ZodString;
        size: z.ZodNumber;
        url: z.ZodString;
        previewUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        folder: z.ZodOptional<z.ZodNumber>;
        folderPath: z.ZodString;
        provider: z.ZodString;
        provider_metadata: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        createdBy: z.ZodOptional<z.ZodNumber>;
        updatedBy: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    /**
     * Array of files schema
     */
    get files(): z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        documentId: z.ZodUUID;
        name: z.ZodString;
        alternativeText: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        caption: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        formats: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        hash: z.ZodString;
        ext: z.ZodOptional<z.ZodString>;
        mime: z.ZodString;
        size: z.ZodNumber;
        url: z.ZodString;
        previewUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        folder: z.ZodOptional<z.ZodNumber>;
        folderPath: z.ZodString;
        provider: z.ZodString;
        provider_metadata: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        createdBy: z.ZodOptional<z.ZodNumber>;
        updatedBy: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    /**
     * File ID parameter validation
     */
    get fileId(): z.ZodNumber;
    /**
     * Upload request body schema for single file uploads
     */
    get uploadBody(): z.ZodObject<{
        fileInfo: z.ZodOptional<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            alternativeText: z.ZodOptional<z.ZodString>;
            caption: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    /**
     * Upload request body schema for multiple file uploads
     */
    get multiUploadBody(): z.ZodObject<{
        fileInfo: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            alternativeText: z.ZodOptional<z.ZodString>;
            caption: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
}
//# sourceMappingURL=upload.d.ts.map