/// <reference types="node" />
import { Readable } from 'stream';
import type { Core } from '@strapi/types';
/**
 * Create a Readable which will stream all the links from a Strapi instance
 */
export declare const createLinksStream: (strapi: Core.Strapi) => Readable;
//# sourceMappingURL=links.d.ts.map