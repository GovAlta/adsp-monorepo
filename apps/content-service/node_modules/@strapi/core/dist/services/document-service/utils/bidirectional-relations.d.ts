import type { UID } from '@strapi/types';
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
/**
 * Loads all bidirectional relations that need to be synchronized when content entries change state
 * (e.g., during publish/unpublish operations).
 *
 * In Strapi, bidirectional relations allow maintaining order from both sides of the relation.
 * When an entry is published, the following occurs:
 *
 * 1. The old published entry is deleted
 * 2. A new entry is created with all its relations
 *
 * This process affects relation ordering in the following way:
 *
 * Initial state (Entry A related to X, Y, Z):
 * ```
 *   Entry A (draft)     Entry A (published)
 *      │                     │
 *      ├──(1)→ X            ├──(1)→ X
 *      ├──(2)→ Y            ├──(2)→ Y
 *      └──(3)→ Z            └──(3)→ Z
 *
 *   X's perspective:         Y's perspective:         Z's perspective:
 *      └──(2)→ Entry A         └──(1)→ Entry A         └──(3)→ Entry A
 * ```
 *
 * After publishing Entry A (without relation order sync):
 * ```
 *   Entry A (draft)     Entry A (new published)
 *      │                     │
 *      ├──(1)→ X            ├──(1)→ X
 *      ├──(2)→ Y            ├──(2)→ Y
 *      └──(3)→ Z            └──(3)→ Z
 *
 *   X's perspective:         Y's perspective:         Z's perspective:
 *      └──(3)→ Entry A         └──(3)→ Entry A         └──(3)→ Entry A
 *                           (all relations appear last in order)
 * ```
 *
 * This module preserves the original ordering from both perspectives by:
 * 1. Capturing the relation order before the entry state changes
 * 2. Restoring this order after the new relations are created
 *
 * @param uid - The unique identifier of the content type being processed
 * @param context - Object containing arrays of old and new entry versions
 * @returns Array of objects containing join table metadata and relations to be updated
 */
declare const load: (uid: UID.ContentType, { oldVersions }: LoadContext) => Promise<any>;
/**
 * Synchronizes the order of bidirectional relations after content entries have changed state.
 *
 * When entries change state (e.g., draft → published), their IDs change and all relations are recreated.
 * While the order of relations from the entry's perspective is maintained (as they're created in order),
 * the inverse relations (from related entries' perspective) would all appear last in order since they're new.
 *
 * Example:
 * ```
 * Before publish:
 *   Article(id:1) →(order:1)→ Category(id:5)
 *   Category(id:5) →(order:3)→ Article(id:1)
 *
 * After publish (without sync):
 *   Article(id:2) →(order:1)→ Category(id:5)    [order preserved]
 *   Category(id:5) →(order:99)→ Article(id:2)   [order lost - appears last]
 *
 * After sync:
 *   Article(id:2) →(order:1)→ Category(id:5)    [order preserved]
 *   Category(id:5) →(order:3)→ Article(id:2)    [order restored]
 * ```
 *
 * @param oldEntries - Array of previous entry versions with their IDs and locales
 * @param newEntries - Array of new entry versions with their IDs and locales
 * @param existingRelations - Array of join table data containing the relations to be updated
 */
declare const sync: (oldEntries: {
    id: string;
    locale: string;
}[], newEntries: {
    id: string;
    locale: string;
}[], existingRelations: {
    joinTable: any;
    relations: any[];
}[]) => Promise<void>;
export { load, sync };
//# sourceMappingURL=bidirectional-relations.d.ts.map