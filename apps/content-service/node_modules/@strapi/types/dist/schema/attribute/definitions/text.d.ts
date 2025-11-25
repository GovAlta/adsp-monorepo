import type { Intersect } from '../../../utils';
import type { Attribute } from '../..';
export interface TextProperties {
    regex?: RegExp;
}
/**
 * Represents a text Strapi attribute along with its options
 */
export type Text = Intersect<[
    Attribute.OfType<'text'>,
    TextProperties,
    Attribute.ConfigurableOption,
    Attribute.DefaultOption<TextValue>,
    Attribute.MinMaxLengthOption,
    Attribute.PrivateOption,
    Attribute.UniqueOption,
    Attribute.RequiredOption,
    Attribute.WritableOption,
    Attribute.VisibleOption
]>;
export type TextValue = string;
export type GetTextValue<T extends Attribute.Attribute> = T extends Text ? TextValue : never;
//# sourceMappingURL=text.d.ts.map