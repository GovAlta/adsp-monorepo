/// <reference types="node" />
import { Writable } from 'stream';
import type { Core } from '@strapi/types';
import { Transaction } from '../../../../../../types';
export declare const createLinksWriteStream: (mapID: (uid: string, id: number) => number | undefined, strapi: Core.Strapi, transaction?: Transaction, onWarning?: (message: string) => void) => Writable;
//# sourceMappingURL=links.d.ts.map