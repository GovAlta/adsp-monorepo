/// <reference types="node" />
import { Writable } from 'stream';
import type { Core } from '@strapi/types';
import { IConfiguration, Transaction } from '../../../../../../types';
export declare const restoreConfigs: (strapi: Core.Strapi, config: IConfiguration) => Promise<any>;
export declare const createConfigurationWriteStream: (strapi: Core.Strapi, transaction?: Transaction) => Promise<Writable>;
//# sourceMappingURL=configuration.d.ts.map