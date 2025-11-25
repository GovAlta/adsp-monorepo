import { isPolymorphic, isBidirectional, isAnyToOne, isOneToAny, hasOrderColumn, hasInverseOrderColumn, isManyToAny } from './relations';
import { Metadata, Meta } from './metadata';
import type { Model } from '../types';
export type { Metadata, Meta };
export { isPolymorphic, isBidirectional, isAnyToOne, isOneToAny, hasOrderColumn, hasInverseOrderColumn, isManyToAny, };
/**
 * Create Metadata from models configurations
 */
export declare const createMetadata: (models: Model[]) => Metadata;
//# sourceMappingURL=index.d.ts.map