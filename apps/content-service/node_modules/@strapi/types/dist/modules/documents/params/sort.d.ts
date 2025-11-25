import type * as Schema from '../../../schema';
import type * as UID from '../../../uid';
import type { Guard } from '../../../utils';
export declare namespace OrderKind {
    type Asc = 'asc';
    type Desc = 'desc';
    type Any = Asc | Desc;
}
/**
 * Single non-populatable attribute representation
 *
 * @example
 * type A = 'title'; // ✅
 * type B = 'description'; // ✅
 * type C = 'title:asc'; // ❌
 * type D = 'title,description'; // ❌
 */
type SingleAttribute<TSchemaUID extends UID.Schema> = 'id' | Guard.Never<Schema.NonPopulatableAttributeNames<TSchemaUID>, string>;
/**
 * Ordered single non-populatable attribute representation
 *
 * @example
 * type A = 'title:asc'; // ✅
 * type B = 'description:desc'; // ✅
 * type C = 'title'; // ❌
 * type D = 'title,description'; // ❌
 */
type OrderedSingleAttribute<TSchemaUID extends UID.Schema> = `${SingleAttribute<TSchemaUID>}:${OrderKind.Any}`;
/**
 * Union of all possible string representation for a sort
 *
 * @example
 * type A = 'title:asc'; // ✅
 * type B = 'description:desc'; // ✅
 * type C = 'title'; // ✅
 * type D = 'title,description:asc'; // ✅
 * type E = [42]; // ❌
 * type F = { title: 'asc' }; // ❌
 */
export type StringNotation<TSchemaUID extends UID.Schema> = SingleAttribute<TSchemaUID> | OrderedSingleAttribute<TSchemaUID> | `${string},${string}`;
/**
 * Array notation for a sort
 *
 * @example
 * type A = ['title:asc', 'description']; // ✅
 * type B = ['title']; // ✅
 * type C = ['count', 'title,description:asc']; // ✅
 * type D = { title: 'asc' }; // ❌
 * type E = [42]; // ❌
 * type F = 'title'; // ❌
 */
export type ArrayNotation<TSchemaUID extends UID.Schema> = StringNotation<TSchemaUID>[] | ObjectNotation<TSchemaUID>[];
/**
 * Object notation for a sort
 *
 * @example
 * type A = { title: 'asc' }; // ✅
 * type B = { title: 'asc', description: 'desc' }; // ✅
 * type C = { title: 'asc', author: { name: 'asc' } }; // ✅
 * type D = { author: { email: 'asc', role: { name: 'desc' } } }; // ✅
 * type E = ['title']; // ❌
 * type F = 'title'; // ❌
 */
export type ObjectNotation<TSchemaUID extends UID.Schema> = {
    [key in SingleAttribute<TSchemaUID>]?: OrderKind.Any;
} & {
    [key in Schema.AttributeNamesWithTarget<TSchemaUID>]?: ObjectNotation<Schema.Attribute.Target<Schema.AttributeByName<TSchemaUID, key>>>;
};
/**
 * Represents any notation for a sort (string, array, object)
 *
 * @example
 * type A = 'title:asc'; // ✅
 * type B = 'description:desc'; // ✅
 * type C = 'title'; // ✅
 * type D = 'title,description:asc'; // ✅
 * type E = ['title:asc', 'description']; // ✅
 * type F = ['title']; // ✅
 * type G = ['count', 'title,description:asc']; // ✅
 * type H = { title: 'asc' }; // ✅
 * type I = { title: 'asc', description: 'desc' }; // ✅
 * type J = { title: 'asc', author: { name: 'asc' } }; // ✅
 * type K = { author: { email: 'asc', role: { name: 'desc' } } }; // ✅
 */
export type Any<TSchemaUID extends UID.Schema> = StringNotation<TSchemaUID> | ArrayNotation<TSchemaUID> | ObjectNotation<TSchemaUID>;
export {};
//# sourceMappingURL=sort.d.ts.map