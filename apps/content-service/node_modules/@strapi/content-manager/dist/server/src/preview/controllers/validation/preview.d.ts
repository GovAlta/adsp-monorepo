/// <reference types="node" />
import type { Core, UID } from '@strapi/types';
import { Preview } from '../../../../../shared/contracts';
import type { HandlerParams } from '../../services/preview-config';
export declare const validatePreviewUrl: (strapi: Core.Strapi, uid: UID.ContentType, params: Preview.GetPreviewUrl.Request['query']) => Promise<HandlerParams>;
//# sourceMappingURL=preview.d.ts.map