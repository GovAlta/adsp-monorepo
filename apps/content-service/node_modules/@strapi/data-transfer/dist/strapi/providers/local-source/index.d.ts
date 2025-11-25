/// <reference types="node" />
import { Readable } from 'stream';
import type { Core, Struct } from '@strapi/types';
import type { IMetadata, ISourceProvider, ProviderType } from '../../../../types';
import type { IDiagnosticReporter } from '../../../utils/diagnostic';
export interface ILocalStrapiSourceProviderOptions {
    getStrapi(): Core.Strapi | Promise<Core.Strapi>;
    autoDestroy?: boolean;
}
export declare const createLocalStrapiSourceProvider: (options: ILocalStrapiSourceProviderOptions) => LocalStrapiSourceProvider;
declare class LocalStrapiSourceProvider implements ISourceProvider {
    #private;
    name: string;
    type: ProviderType;
    options: ILocalStrapiSourceProviderOptions;
    strapi?: Core.Strapi;
    constructor(options: ILocalStrapiSourceProviderOptions);
    bootstrap(diagnostics?: IDiagnosticReporter): Promise<void>;
    close(): Promise<void>;
    getMetadata(): IMetadata;
    createEntitiesReadStream(): Promise<Readable>;
    createLinksReadStream(): Readable;
    createConfigurationReadStream(): Readable;
    getSchemas(): Record<string, Struct.Schema>;
    createSchemasReadStream(): Readable;
    createAssetsReadStream(): Readable;
}
export type ILocalStrapiSourceProvider = InstanceType<typeof LocalStrapiSourceProvider>;
export {};
//# sourceMappingURL=index.d.ts.map