import type { Model } from '../types';
import type { ForeignKey, Index } from '../schema/types';
import type { Action, SubscriberFn } from '../lifecycles';
export interface Meta extends Model {
    columnToAttribute: Record<string, string>;
    indexes: Index[];
    foreignKeys: ForeignKey[];
    lifecycles: Partial<Record<Action, SubscriberFn>>;
}
export declare class Metadata extends Map<string, Meta> {
    get identifiers(): import("../utils/identifiers").Identifiers;
    get(key: string): Meta;
    add(meta: Meta): this;
    /**
     * Validate the DB metadata, throwing an error if a duplicate DB table name is detected
     */
    validate(): void;
    loadModels(models: Model[]): void;
}
//# sourceMappingURL=metadata.d.ts.map