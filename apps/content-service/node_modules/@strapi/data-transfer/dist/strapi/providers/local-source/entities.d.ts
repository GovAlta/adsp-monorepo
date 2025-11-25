/// <reference types="node" />
import { Readable, Transform } from 'stream';
import type { Core } from '@strapi/types';
/**
 * Generate and consume content-types streams in order to stream each entity individually
 */
export declare const createEntitiesStream: (strapi: Core.Strapi) => Readable;
/**
 * Create an entity transform stream which convert the output of
 * the multi-content-types stream to the transfer entity format
 */
export declare const createEntitiesTransformStream: () => Transform;
//# sourceMappingURL=entities.d.ts.map