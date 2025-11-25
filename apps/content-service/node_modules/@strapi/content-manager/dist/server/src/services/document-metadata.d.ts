import type { Core, UID, Modules } from '@strapi/types';
import type { DocumentMetadata } from '../../../shared/contracts/collection-types';
export interface DocumentVersion {
    id: string | number;
    documentId: Modules.Documents.ID;
    locale?: string;
    localizations?: DocumentVersion[];
    updatedAt?: string | null | Date;
    publishedAt?: string | null | Date;
}
/**
 * Controls the metadata properties to be returned
 *
 * If `availableLocales` is set to `true` (default), the returned metadata will include
 * the available locales of the document for its current status.
 *
 * If `availableStatus` is set to `true` (default), the returned metadata will include
 * the available status of the document for its current locale.
 */
export interface GetMetadataOptions {
    availableLocales?: boolean;
    availableStatus?: boolean;
}
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    /**
     * Returns available locales of a document for the current status
     */
    getAvailableLocales(uid: UID.ContentType, version: DocumentVersion, allVersions: DocumentVersion[]): Promise<import("../../../shared/contracts/collection-types").AvailableLocaleDocument[]>;
    /**
     * Returns available status of a document for the current locale
     */
    getAvailableStatus(version: DocumentVersion, allVersions: DocumentVersion[]): Partial<DocumentVersion> | undefined;
    /**
     * Get the available status of many documents, useful for batch operations
     * @param uid
     * @param documents
     * @returns
     */
    getManyAvailableStatus(uid: UID.ContentType, documents: DocumentVersion[]): Promise<any[]>;
    getStatus(version: DocumentVersion, otherDocumentStatuses?: DocumentMetadata['availableStatus']): string;
    getMetadata(uid: UID.ContentType, version: DocumentVersion, { availableLocales, availableStatus }?: GetMetadataOptions): Promise<{
        availableLocales: import("../../../shared/contracts/collection-types").AvailableLocaleDocument[];
        availableStatus: Partial<DocumentVersion>[];
    }>;
    /**
     * Returns associated metadata of a document:
     * - Available locales of the document for the current status
     * - Available status of the document for the current locale
     */
    formatDocumentWithMetadata(uid: UID.ContentType, document: DocumentVersion, opts?: GetMetadataOptions): Promise<{
        data: {
            status: string | undefined;
            id: string | number;
            documentId: string;
            locale?: string | undefined;
            localizations?: DocumentVersion[] | undefined;
            updatedAt?: string | Date | null | undefined;
            publishedAt?: string | Date | null | undefined;
        };
        meta: {
            availableLocales: import("../../../shared/contracts/collection-types").AvailableLocaleDocument[];
            availableStatus: Partial<DocumentVersion>[];
        };
    }>;
};
export default _default;
//# sourceMappingURL=document-metadata.d.ts.map