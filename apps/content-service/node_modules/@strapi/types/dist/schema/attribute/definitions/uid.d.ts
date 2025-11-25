import type { Intersect } from '../../../utils';
import type { Attribute } from '../..';
export interface UIDOptions {
    separator?: string;
    lowercase?: boolean;
    decamelize?: boolean;
    customReplacements?: Array<[string, string]>;
    preserveLeadingUnderscore?: boolean;
}
export interface UIDProperties<TTargetAttribute extends string = string, TOptions extends UIDOptions = UIDOptions> {
    targetField?: TTargetAttribute;
    options?: UIDOptions & TOptions;
    regex?: RegExp['source'];
}
/**
 * Represents a UID Strapi attribute along with its options
 */
export type UID<TTargetAttribute extends string = string, TOptions extends UIDOptions = UIDOptions> = Intersect<[
    Attribute.OfType<'uid'>,
    UIDProperties<TTargetAttribute, TOptions>,
    Attribute.ConfigurableOption,
    Attribute.DefaultOption<UIDValue>,
    Attribute.MinMaxLengthOption,
    Attribute.PrivateOption,
    Attribute.RequiredOption,
    Attribute.WritableOption,
    Attribute.VisibleOption
]>;
export type UIDValue = string;
export type GetUIDValue<TAttribute extends Attribute.Attribute> = TAttribute extends UID ? UIDValue : never;
//# sourceMappingURL=uid.d.ts.map