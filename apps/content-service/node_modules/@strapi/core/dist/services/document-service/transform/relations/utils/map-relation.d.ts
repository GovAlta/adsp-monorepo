/// <reference types="lodash" />
import { Relation } from './types';
declare const mapRelationCurried: import("lodash").CurriedFunction2<(relation: any) => any, Relation, Promise<Relation>>;
declare const traverseEntityRelationsCurried: import("lodash").CurriedFunction3<import("@strapi/utils/dist/traverse-entity").Visitor, import("@strapi/utils/dist/traverse-entity").TraverseOptions, import("@strapi/utils/dist/types").Data, Promise<import("@strapi/utils/dist/types").Data>>;
export { mapRelationCurried as mapRelation, traverseEntityRelationsCurried as traverseEntityRelations, };
//# sourceMappingURL=map-relation.d.ts.map