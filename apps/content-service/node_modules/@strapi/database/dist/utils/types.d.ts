import type { Attribute, ScalarAttribute, RelationalAttribute } from '../types';
export declare const isString: (type: string) => boolean;
export declare const isNumber: (type: string) => boolean;
export declare const isScalar: (type: string) => boolean;
export declare const isRelation: (type: string) => boolean;
export declare const isScalarAttribute: (attribute: Attribute) => attribute is ScalarAttribute;
export declare const isRelationalAttribute: (attribute: Attribute) => attribute is RelationalAttribute;
//# sourceMappingURL=types.d.ts.map