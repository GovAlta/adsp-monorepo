import type { Meta, Metadata } from './metadata';
import type { RelationalAttribute, Relation } from '../types';
export declare const isPolymorphic: (attribute: RelationalAttribute) => attribute is Relation.Morph;
export declare const isOneToAny: (attribute: RelationalAttribute) => attribute is Relation.OneToOne | Relation.OneToMany;
export declare const isManyToAny: (attribute: RelationalAttribute) => attribute is Relation.ManyToOne | Relation.ManyToMany;
export declare const isAnyToOne: (attribute: RelationalAttribute) => attribute is Relation.OneToOne | Relation.ManyToOne;
export declare const isAnyToMany: (attribute: RelationalAttribute) => attribute is Relation.OneToMany | Relation.ManyToMany;
export declare const isBidirectional: (attribute: RelationalAttribute) => attribute is Relation.Bidirectional;
export declare const hasOrderColumn: (attribute: RelationalAttribute) => boolean;
export declare const hasInverseOrderColumn: (attribute: RelationalAttribute) => boolean;
/**
 * Creates a relation metadata
 */
export declare const createRelation: (attributeName: string, attribute: RelationalAttribute, meta: Meta, metadata: Metadata) => void;
//# sourceMappingURL=relations.d.ts.map