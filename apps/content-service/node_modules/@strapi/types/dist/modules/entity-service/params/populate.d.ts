import type * as Schema from '../../../schema';
import type * as UID from '../../../uid';
import type { Constants, Guard, If, And, DoesNotExtends, IsNotNever, XOR } from '../../../utils';
import type { Params } from '..';
/**
 * Wildcard notation for populate
 *
 * To populate all the root level relations
 */
export type WildcardNotation = '*';
/**
 * Union of all possible string representation for populate
 *
 * @example
 * type A = 'image'; // ✅
 * type B = 'image,component'; // ✅
 * type c = '*'; // ✅
 * type D = 'populatableField'; // ✅
 * type E = '<random_string>'; // ❌
 */
export type StringNotation<TSchemaUID extends UID.Schema> = WildcardNotation | Guard.Never<Schema.PopulatableAttributeNames<TSchemaUID>, string> | `${string},${string}` | `${string}.${string}`;
/**
 * Array notation for populate
 *
 * @example
 * type A = ['image']; // ✅
 * type B = ['image', 'component']; // ✅
 * type C = ['populatableField']; // ✅
 * type D = ['<random_string>']; // ❌
 * type E = ['*']; // ❌
 */
export type ArrayNotation<TSchemaUID extends UID.Schema> = Exclude<StringNotation<TSchemaUID>, WildcardNotation>[];
type GetPopulatableKeysWithTarget<TSchemaUID extends UID.Schema> = Extract<Schema.PopulatableAttributeNames<TSchemaUID>, Schema.AttributeNamesWithTarget<TSchemaUID>>;
type GetPopulatableKeysWithoutTarget<TSchemaUID extends UID.Schema> = Exclude<Schema.PopulatableAttributeNames<TSchemaUID>, GetPopulatableKeysWithTarget<TSchemaUID>>;
/**
 * Fragment populate notation for polymorphic attributes
 */
export type Fragment<TMaybeTargets extends UID.Schema> = {
    on?: {
        [TKey in TMaybeTargets]?: boolean | NestedParams<TKey>;
    };
};
type PopulateClause<TSchemaUID extends UID.Schema, TKeys extends Schema.PopulatableAttributeNames<TSchemaUID>> = {
    [TKey in TKeys]?: boolean | NestedParams<Schema.Attribute.Target<Schema.AttributeByName<TSchemaUID, TKey>>>;
};
/**
 * Object notation for populate
 *
 * @example
 * type A = { image: true }; // ✅
 * type B = { image: { fields: ['url', 'provider'] } }; // ✅
 * type C = { populatableField: { populate: { nestedPopulatableField: true } } }; // ✅
 * type D = { dynamic_zone: { on: { comp_A: { fields: ['name', 'price_a'] }, comp_B: { fields: ['name', 'price_b'] } } } }; // ✅
 */
export type ObjectNotation<TSchemaUID extends UID.Schema> = [
    GetPopulatableKeysWithTarget<TSchemaUID>,
    GetPopulatableKeysWithoutTarget<TSchemaUID>
] extends [
    infer TKeysWithTarget extends Schema.PopulatableAttributeNames<TSchemaUID>,
    infer TKeysWithoutTarget extends Schema.PopulatableAttributeNames<TSchemaUID>
] ? If<And<Constants.AreSchemaRegistriesExtended, DoesNotExtends<UID.Schema, TSchemaUID>>, If<IsNotNever<TKeysWithTarget>, PopulateClause<TSchemaUID, TKeysWithTarget>> | If<IsNotNever<TKeysWithoutTarget>, {
    [TKey in TKeysWithoutTarget]?: boolean | Fragment<Guard.Never<Schema.Attribute.MorphTargets<Schema.AttributeByName<TSchemaUID, TKey>>, UID.Schema>>;
}>, {
    [key: string]: boolean | XOR<NestedParams<UID.Schema>, Fragment<UID.Schema>>;
}> : never;
export type NestedParams<TSchemaUID extends UID.Schema> = Params.Pick<TSchemaUID, 'fields' | 'filters' | 'populate' | 'sort' | 'plugin'>;
export type Any<TSchemaUID extends UID.Schema> = StringNotation<TSchemaUID> | ArrayNotation<TSchemaUID> | ObjectNotation<TSchemaUID>;
export {};
//# sourceMappingURL=populate.d.ts.map