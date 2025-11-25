/// <reference types="node" />
/// <reference types="stream-chain" />
/// <reference types="node" />
import zlib from 'zlib';
import { Writable } from 'stream';
import type { IDestinationProvider, IDestinationProviderTransferResults, IMetadata, ProviderType } from '../../../../types';
import type { IDiagnosticReporter } from '../../../utils/diagnostic';
export interface ILocalFileDestinationProviderOptions {
    encryption: {
        enabled: boolean;
        key?: string;
    };
    compression: {
        enabled: boolean;
    };
    file: {
        path: string;
        maxSize?: number;
        maxSizeJsonl?: number;
    };
}
export interface ILocalFileDestinationProviderTransferResults extends IDestinationProviderTransferResults {
    file?: {
        path?: string;
    };
}
export declare const createLocalFileDestinationProvider: (options: ILocalFileDestinationProviderOptions) => LocalFileDestinationProvider;
declare class LocalFileDestinationProvider implements IDestinationProvider {
    #private;
    name: string;
    type: ProviderType;
    options: ILocalFileDestinationProviderOptions;
    results: ILocalFileDestinationProviderTransferResults;
    constructor(options: ILocalFileDestinationProviderOptions);
    setMetadata(target: ProviderType, metadata: IMetadata): IDestinationProvider;
    createGzip(): zlib.Gzip;
    bootstrap(diagnostics: IDiagnosticReporter): void | Promise<void>;
    close(): Promise<void>;
    rollback(): Promise<void>;
    getMetadata(): null;
    createSchemasWriteStream(): import("stream-chain");
    createEntitiesWriteStream(): Writable;
    createLinksWriteStream(): Writable;
    createConfigurationWriteStream(): Writable;
    createAssetsWriteStream(): Writable;
}
export {};
//# sourceMappingURL=index.d.ts.map