/// <reference types="node" />
import { Writable } from 'stream';
import type { Core, UID } from '@strapi/types';
import type { Transaction } from '../../../../../../types';
interface IEntitiesRestoreStreamOptions {
    strapi: Core.Strapi;
    updateMappingTable<TSchemaUID extends UID.Schema>(type: TSchemaUID, oldID: number, newID: number): void;
    transaction?: Transaction;
}
export declare const createEntitiesWriteStream: (options: IEntitiesRestoreStreamOptions) => Writable;
export {};
//# sourceMappingURL=entities.d.ts.map