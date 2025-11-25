import { WebSocket } from 'ws';
import type { Client } from '../../../types/remote/protocol';
import { IDiagnosticReporter } from '../../utils/diagnostic';
interface IDispatcherState {
    transfer?: {
        kind: Client.TransferKind;
        id: string;
    };
}
interface IDispatchOptions {
    attachTransfer?: boolean;
}
type Dispatch<T> = Omit<T, 'transferID' | 'uuid'>;
export declare const createDispatcher: (ws: WebSocket, retryMessageOptions?: {
    retryMessageMaxRetries: number;
    retryMessageTimeout: number;
}, reportInfo?: (message: string) => void) => {
    readonly transferID: string | undefined;
    readonly transferKind: any;
    setTransferProperties: (properties: Exclude<IDispatcherState['transfer'], undefined>) => void;
    dispatch: <U = null>(message: Dispatch<Client.Message>, options?: IDispatchOptions) => Promise<U | null>;
    dispatchCommand: <U_1 extends "end" | "init" | "status">(payload: {
        command: U_1;
    } & ([Client.GetCommandParams<U_1>] extends [never] ? unknown : {
        params?: Client.GetCommandParams<U_1> | undefined;
    })) => Promise<null>;
    dispatchTransferAction: <T>(action: Client.Action['action']) => Promise<T | null>;
    dispatchTransferStep: <T_1, A extends "end" | "start" | "stream" = "end" | "start" | "stream", S extends "entities" | "links" | "assets" | "configuration" = "entities" | "links" | "assets" | "configuration">(payload: {
        step: S;
        action: A;
    } & (A extends 'stream' ? {
        data: Client.GetTransferPushStreamData<S>;
    } : unknown)) => Promise<T_1 | null>;
};
type WebsocketParams = ConstructorParameters<typeof WebSocket>;
type Address = WebsocketParams[0];
type Options = WebsocketParams[2];
export declare const connectToWebsocket: (address: Address, options?: Options, diagnostics?: IDiagnosticReporter) => Promise<WebSocket>;
export declare const trimTrailingSlash: (input: string) => string;
export declare const wait: (ms: number) => Promise<void>;
export declare const waitUntil: (test: () => boolean, interval: number) => Promise<void>;
export {};
//# sourceMappingURL=utils.d.ts.map