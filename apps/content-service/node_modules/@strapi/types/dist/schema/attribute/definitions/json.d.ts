import type { Intersect, JSONValue, JSONPrimitive } from '../../../utils';
import type { Attribute } from '../..';
/**
 * Represents a JSON Strapi attribute along with its options
 */
export type JSON = Intersect<[
    Attribute.OfType<'json'>,
    Attribute.ConfigurableOption,
    Attribute.RequiredOption,
    Attribute.PrivateOption,
    Attribute.WritableOption,
    Attribute.VisibleOption,
    Attribute.DefaultOption<JSONPrimitive>
]>;
export type JsonValue = JSONValue;
export type GetJsonValue<T extends Attribute.Attribute> = T extends JSON ? JsonValue : never;
//# sourceMappingURL=json.d.ts.map