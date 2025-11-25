import type { UID } from '@strapi/types';
interface Options {
    /**
     * Fields to select when populating relations
     */
    relationalFields?: string[];
}
export declare const getDeepPopulate: (uid: UID.Schema, opts?: Options) => any;
export {};
//# sourceMappingURL=populate.d.ts.map