import type { UID } from '@strapi/types';
import { LongHandDocument } from './types';
type Status = 'draft' | 'published';
export declare const getRelationTargetStatus: (relation: Pick<LongHandDocument, 'documentId' | 'status'>, opts: {
    targetUid: UID.Schema;
    sourceUid: UID.Schema;
    sourceStatus?: Status;
}) => Status[];
export {};
//# sourceMappingURL=dp.d.ts.map