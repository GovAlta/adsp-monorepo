import type { UID, Schema } from '@strapi/types';
import type { JoinTable } from '@strapi/database';
interface LoadContext {
    oldVersions: {
        id: string;
        locale: string;
    }[];
    newVersions: {
        id: string;
        locale: string;
    }[];
}
interface RelationUpdate {
    joinTable: JoinTable;
    relations: Record<string, any>[];
}
interface RelationFilterOptions {
    /**
     * Function to determine if a relation should be propagated to new document versions
     * This replaces the hardcoded component-specific logic
     */
    shouldPropagateRelation?: (relation: Record<string, any>, model: Schema.Component | Schema.ContentType, trx: any) => Promise<boolean>;
}
/**
 * Loads lingering relations that need to be updated when overriding a published or draft entry.
 * This is necessary because the relations are uni-directional and the target entry is not aware of the source entry.
 * This is not the case for bi-directional relations, where the target entry is also linked to the source entry.
 */
declare const load: (uid: UID.ContentType, { oldVersions, newVersions }: LoadContext, options?: RelationFilterOptions) => Promise<RelationUpdate[]>;
/**
 * Updates uni directional relations to target the right entries when overriding published or draft entries.
 *
 * This function:
 * 1. Creates new relations pointing to the new entry versions
 * 2. Precisely deletes only the old relations being replaced to prevent orphaned links
 *
 * @param oldEntries The old entries that are being overridden
 * @param newEntries The new entries that are overriding the old ones
 * @param oldRelations The relations that were previously loaded with `load` @see load
 */
declare const sync: (oldEntries: {
    id: string;
    locale: string;
}[], newEntries: {
    id: string;
    locale: string;
}[], oldRelations: {
    joinTable: any;
    relations: any[];
}[]) => Promise<void>;
export { load, sync };
export type { RelationFilterOptions };
//# sourceMappingURL=unidirectional-relations.d.ts.map