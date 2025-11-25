/// <reference types="node" />
import type { Readable } from 'stream';
import type { IMetadata, ISourceProvider, ProviderType } from '../../../../types';
import type { IDiagnosticReporter } from '../../../utils/diagnostic';
/**
 * Provider options
 */
export interface ILocalFileSourceProviderOptions {
    file: {
        path: string;
    };
    encryption: {
        enabled: boolean;
        key?: string;
    };
    compression: {
        enabled: boolean;
    };
}
export declare const createLocalFileSourceProvider: (options: ILocalFileSourceProviderOptions) => LocalFileSourceProvider;
declare class LocalFileSourceProvider implements ISourceProvider {
    #private;
    type: ProviderType;
    name: string;
    options: ILocalFileSourceProviderOptions;
    constructor(options: ILocalFileSourceProviderOptions);
    /**
     * Pre flight checks regarding the provided options, making sure that the file can be opened (decrypted, decompressed), etc.
     */
    bootstrap(diagnostics: IDiagnosticReporter): Promise<void>;
    getMetadata(): Promise<IMetadata | null>;
    getSchemas(): Promise<any>;
    createEntitiesReadStream(): Readable;
    createSchemasReadStream(): Readable;
    createLinksReadStream(): Readable;
    createConfigurationReadStream(): Readable;
    createAssetsReadStream(): Readable | Promise<Readable>;
}
export {};
//# sourceMappingURL=index.d.ts.map