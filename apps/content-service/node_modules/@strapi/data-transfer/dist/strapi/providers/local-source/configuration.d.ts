/// <reference types="node" />
import { Readable } from 'stream';
import type { Core } from '@strapi/types';
/**
 * Create a readable stream that export the Strapi app configuration
 */
export declare const createConfigurationStream: (strapi: Core.Strapi) => Readable;
//# sourceMappingURL=configuration.d.ts.map