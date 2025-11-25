import type { Core, UID } from '@strapi/types';
import type { HandlerParams } from './preview-config';
/**
 * Responsible of routing an entry to a preview URL.
 */
declare const createPreviewService: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    getPreviewUrl(uid: UID.ContentType, params: HandlerParams): Promise<string | undefined>;
};
export { createPreviewService };
//# sourceMappingURL=preview.d.ts.map