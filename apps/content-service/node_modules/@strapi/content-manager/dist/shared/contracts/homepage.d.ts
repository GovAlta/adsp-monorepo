import type { errors } from '@strapi/utils';
import type { Struct, UID } from '@strapi/types';
export interface RecentDocument {
    kind: Struct.ContentTypeKind;
    contentTypeUid: UID.ContentType;
    contentTypeDisplayName: string;
    documentId: string;
    locale: string | null;
    status?: 'draft' | 'published' | 'modified';
    title: string;
    updatedAt: Date;
    publishedAt?: Date | null;
}
export declare namespace GetRecentDocuments {
    interface Request {
        body: {};
        query: {
            action: 'update' | 'publish';
        };
    }
    interface Response {
        data: RecentDocument[];
        error?: errors.ApplicationError;
    }
}
export declare namespace GetCountDocuments {
    interface Request {
        body: {};
    }
    interface Response {
        data: {
            draft: number;
            published: number;
            modified: number;
        };
        error?: errors.ApplicationError;
    }
}
