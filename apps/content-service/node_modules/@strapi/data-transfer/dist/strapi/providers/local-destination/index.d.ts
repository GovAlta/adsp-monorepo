/// <reference types="node" />
import { Writable } from 'stream';
import type { Core, Struct } from '@strapi/types';
import type { IDestinationProvider, IMetadata, ProviderType, Transaction } from '../../../../types';
import type { IDiagnosticReporter } from '../../../utils/diagnostic';
import { restore } from './strategies';
export declare const VALID_CONFLICT_STRATEGIES: string[];
export declare const DEFAULT_CONFLICT_STRATEGY = "restore";
export interface ILocalStrapiDestinationProviderOptions {
    getStrapi(): Core.Strapi | Promise<Core.Strapi>;
    autoDestroy?: boolean;
    restore?: restore.IRestoreOptions;
    strategy: 'restore';
}
declare class LocalStrapiDestinationProvider implements IDestinationProvider {
    #private;
    name: string;
    type: ProviderType;
    options: ILocalStrapiDestinationProviderOptions;
    strapi?: Core.Strapi;
    transaction?: Transaction;
    uploadsBackupDirectoryName: string;
    onWarning?: ((message: string) => void) | undefined;
    constructor(options: ILocalStrapiDestinationProviderOptions);
    bootstrap(diagnostics?: IDiagnosticReporter): Promise<void>;
    close(): Promise<void>;
    rollback(): Promise<void>;
    beforeTransfer(): Promise<void>;
    getMetadata(): IMetadata;
    getSchemas(): Record<string, Struct.Schema>;
    createEntitiesWriteStream(): Writable;
    createAssetsWriteStream(): Promise<Writable>;
    createConfigurationWriteStream(): Promise<Writable>;
    createLinksWriteStream(): Promise<Writable>;
}
export declare const createLocalStrapiDestinationProvider: (options: ILocalStrapiDestinationProviderOptions) => LocalStrapiDestinationProvider;
export {};
//# sourceMappingURL=index.d.ts.map