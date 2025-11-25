/// <reference types="node" />
import { Duplex } from 'stream';
import type { Core } from '@strapi/types';
/**
 * Generate and consume assets streams in order to stream each file individually
 */
export declare const createAssetsStream: (strapi: Core.Strapi) => Duplex;
//# sourceMappingURL=assets.d.ts.map