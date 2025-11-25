/// <reference types="node" />
import { Writable } from 'stream';
import { WebSocket } from 'ws';
import type { Struct, Utils } from '@strapi/types';
import { createDispatcher } from '../utils';
import type { IDestinationProvider, IMetadata, ProviderType, TransferStage } from '../../../../types';
import type { IDiagnosticReporter } from '../../../utils/diagnostic';
import type { Auth } from '../../../../types/remote/protocol';
import type { ILocalStrapiDestinationProviderOptions } from '../local-destination';
export interface IRemoteStrapiDestinationProviderOptions extends Pick<ILocalStrapiDestinationProviderOptions, 'restore' | 'strategy'> {
    url: URL;
    auth?: Auth.ITransferTokenAuth;
    retryMessageOptions?: {
        retryMessageTimeout: number;
        retryMessageMaxRetries: number;
    };
}
declare class RemoteStrapiDestinationProvider implements IDestinationProvider {
    #private;
    name: string;
    type: ProviderType;
    options: IRemoteStrapiDestinationProviderOptions;
    ws: WebSocket | null;
    dispatcher: ReturnType<typeof createDispatcher> | null;
    transferID: string | null;
    stats: {
        [TStage in Exclude<TransferStage, 'schemas'>]: {
            count: number;
        };
    };
    constructor(options: IRemoteStrapiDestinationProviderOptions);
    private resetStats;
    initTransfer(): Promise<string>;
    bootstrap(diagnostics?: IDiagnosticReporter): Promise<void>;
    close(): Promise<void>;
    getMetadata(): Promise<IMetadata | null> | null;
    beforeTransfer(): Promise<void>;
    rollback(): Promise<void>;
    getSchemas(): Promise<Utils.String.Dict<Struct.Schema> | null>;
    createEntitiesWriteStream(): Writable;
    createLinksWriteStream(): Writable;
    createConfigurationWriteStream(): Writable;
    createAssetsWriteStream(): Writable | Promise<Writable>;
}
export declare const createRemoteStrapiDestinationProvider: (options: IRemoteStrapiDestinationProviderOptions) => RemoteStrapiDestinationProvider;
export {};
//# sourceMappingURL=index.d.ts.map