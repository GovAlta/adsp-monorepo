import type { UID } from '@strapi/types';
import { IdMap } from '../../id-map';
interface Options {
    uid: UID.Schema;
    locale?: string | null;
    status?: 'draft' | 'published';
}
/**
 * Iterate over all relations of a data object and extract all relational document ids.
 * Those will later be transformed to entity ids.
 */
declare const extractDataIds: (idMap: IdMap, data: Record<string, any>, source: Options) => Promise<import("@strapi/utils/dist/types").Data>;
export { extractDataIds };
//# sourceMappingURL=data-ids.d.ts.map