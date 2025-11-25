/// <reference types="lodash" />
import type { UID, Modules } from '@strapi/types';
type Data = Modules.Documents.Params.Data.Input<UID.Schema>;
declare const applyTransforms: import("lodash").CurriedFunction2<import("@strapi/types/dist/struct").ComponentSchema | import("@strapi/types/dist/struct").ContentTypeSchema, Data, Data>;
export { applyTransforms };
//# sourceMappingURL=index.d.ts.map