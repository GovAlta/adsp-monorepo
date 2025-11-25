import type { Core, Modules, Schema, Data, Struct, UID } from '@strapi/types';
import type { CreateHistoryVersion } from '../../../../shared/contracts/history-versions';
import type { HistoryVersions } from '../../../../shared/contracts';
import type { RelationResult } from '../../../../shared/contracts/relations';
type RelationResponse = {
    results: RelationResult[];
    meta: {
        missingCount: number;
    };
};
export declare const createServiceUtils: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    getSchemaAttributesDiff: (versionSchemaAttributes: CreateHistoryVersion['schema'], contentTypeSchemaAttributes: Struct.SchemaAttributes) => {
        added: Struct.SchemaAttributes;
        removed: Struct.SchemaAttributes;
    };
    getRelationRestoreValue: (versionRelationData: Modules.Documents.AnyDocument | Modules.Documents.AnyDocument[], attribute: Schema.Attribute.RelationWithTarget) => Promise<Modules.Documents.AnyDocument | (Modules.Documents.AnyDocument | null)[] | null>;
    getMediaRestoreValue: (versionRelationData: Modules.Documents.AnyDocument | Modules.Documents.AnyDocument[]) => Promise<any>;
    getDefaultLocale: () => Promise<any>;
    isLocalizedContentType: (model: Schema.ContentType) => any;
    getLocaleDictionary: () => Promise<{
        [key: string]: {
            name: string;
            code: string;
        };
    }>;
    getRetentionDays: () => number;
    getVersionStatus: (contentTypeUid: HistoryVersions.CreateHistoryVersion['contentType'], document: Modules.Documents.AnyDocument | null) => Promise<any>;
    getDeepPopulate: (uid: UID.Schema, useDatabaseSyntax?: boolean) => any;
    buildMediaResponse: (values: {
        id: Data.ID;
    }[]) => Promise<RelationResponse>;
    buildRelationReponse: (values: {
        documentId: string;
        locale: string | null;
    }[], attributeSchema: Schema.Attribute.RelationWithTarget) => Promise<RelationResponse>;
};
export {};
//# sourceMappingURL=utils.d.ts.map