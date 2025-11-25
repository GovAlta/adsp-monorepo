import type { Attribute, Model } from './types';
export declare const getRelationalFields: (contentType: Model) => string[];
export declare const isOneToAny: (attribute: Attribute) => boolean;
export declare const isManyToAny: (attribute: Attribute) => boolean;
export declare const isAnyToOne: (attribute: Attribute) => boolean;
export declare const isAnyToMany: (attribute: Attribute) => boolean;
export declare const isPolymorphic: (attribute: any) => any;
export declare const constants: {
    MANY_RELATIONS: string[];
};
export declare const VALID_RELATION_ORDERING_KEYS: {
    [key: string]: (value: any) => boolean;
};
//# sourceMappingURL=relations.d.ts.map