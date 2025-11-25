import type { Core, Struct } from '@strapi/types';
import type { Configuration } from '../../../shared/contracts/content-types';
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    sendDidConfigureListView: (contentType: Struct.ContentTypeSchema, configuration: Configuration) => Promise<void>;
};
export default _default;
//# sourceMappingURL=metrics.d.ts.map