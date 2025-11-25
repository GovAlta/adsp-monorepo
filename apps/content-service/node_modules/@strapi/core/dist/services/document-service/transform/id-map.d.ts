import type { Core, Data } from '@strapi/types';
interface KeyFields {
    uid: string;
    documentId: Data.ID;
    locale?: string | null;
    status?: 'draft' | 'published';
}
export interface IdMap {
    loadedIds: Map<string, string>;
    toLoadIds: Map<string, KeyFields>;
    add(keys: KeyFields): void;
    load(): Promise<void>;
    get(keys: KeyFields): string | undefined;
    clear(): void;
}
/**
 * Holds a registry of document ids and their corresponding entity ids.
 */
declare const createIdMap: ({ strapi }: {
    strapi: Core.Strapi;
}) => IdMap;
export { createIdMap };
//# sourceMappingURL=id-map.d.ts.map