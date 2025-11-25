import type { UID } from '@strapi/types';
import { DocumentVersion, GetMetadataOptions } from '../../services/document-metadata';
import type { AvailableLocaleDocument } from '../../../../shared/contracts/collection-types';
/**
 * Format a document with metadata. Making sure the metadata response is
 * correctly sanitized for the current user
 */
export declare const formatDocumentWithMetadata: (permissionChecker: any, uid: UID.ContentType, document: DocumentVersion, opts?: GetMetadataOptions) => Promise<{
    meta: {
        availableLocales: AvailableLocaleDocument[];
        availableStatus: Partial<DocumentVersion>[];
    };
    data: {
        status: string | undefined;
        id: string | number;
        documentId: string;
        locale?: string | undefined;
        localizations?: DocumentVersion[] | undefined;
        updatedAt?: string | Date | null | undefined;
        publishedAt?: string | Date | null | undefined;
    };
}>;
//# sourceMappingURL=metadata.d.ts.map