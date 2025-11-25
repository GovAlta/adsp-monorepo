/// <reference types="node" />
import { Readable, Writable } from 'stream';
import type { Struct, Utils } from '@strapi/types';
import { WebSocket } from 'ws';
import type { IMetadata, ISourceProvider, ISourceProviderTransferResults, MaybePromise, ProviderType } from '../../../../types';
import type { IDiagnosticReporter } from '../../../utils/diagnostic';
import { Auth } from '../../../../types/remote/protocol';
import { ILocalStrapiSourceProviderOptions } from '../local-source';
import { createDispatcher } from '../utils';
export interface IRemoteStrapiSourceProviderOptions extends ILocalStrapiSourceProviderOptions {
    url: URL;
    auth?: Auth.ITransferTokenAuth;
    retryMessageOptions?: {
        retryMessageTimeout: number;
        retryMessageMaxRetries: number;
    };
    streamTimeout?: number;
}
declare class RemoteStrapiSourceProvider implements ISourceProvider {
    #private;
    name: string;
    type: ProviderType;
    options: IRemoteStrapiSourceProviderOptions;
    ws: WebSocket | null;
    dispatcher: ReturnType<typeof createDispatcher> | null;
    defaultOptions: Partial<IRemoteStrapiSourceProviderOptions>;
    constructor(options: IRemoteStrapiSourceProviderOptions);
    results?: ISourceProviderTransferResults | undefined;
    createEntitiesReadStream(): MaybePromise<Readable>;
    createLinksReadStream(): MaybePromise<Readable>;
    writeAsync: <T>(stream: Writable, data: T) => Promise<void>;
    createAssetsReadStream(): Promise<Readable>;
    createConfigurationReadStream(): MaybePromise<Readable>;
    getMetadata(): Promise<IMetadata | null>;
    assertValidProtocol(url: URL): void;
    initTransfer(): Promise<string>;
    bootstrap(diagnostics?: IDiagnosticReporter): Promise<void>;
    close(): Promise<void>;
    getSchemas(): Promise<Utils.String.Dict<Struct.Schema> | null>;
}
export declare const createRemoteStrapiSourceProvider: (options: IRemoteStrapiSourceProviderOptions) => RemoteStrapiSourceProvider;
export {};
//# sourceMappingURL=index.d.ts.map