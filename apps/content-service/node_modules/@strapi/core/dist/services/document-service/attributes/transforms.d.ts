import type { Schema } from '@strapi/types';
type Transforms = {
    [TKind in Schema.Attribute.Kind]?: (value: unknown, context: {
        attribute: Schema.Attribute.AnyAttribute;
        attributeName: string;
    }) => any;
};
declare const transforms: Transforms;
export default transforms;
//# sourceMappingURL=transforms.d.ts.map