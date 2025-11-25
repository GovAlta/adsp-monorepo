import type { UID } from '@strapi/types';
import { LongHandDocument } from './types';
export declare const isLocalizedContentType: (uid: UID.Schema) => any;
export declare const getDefaultLocale: () => any;
export declare const getRelationTargetLocale: (relation: LongHandDocument, opts: {
    targetUid: UID.Schema;
    sourceUid: UID.Schema;
    sourceLocale?: string | null;
}) => string | null | undefined;
//# sourceMappingURL=i18n.d.ts.map