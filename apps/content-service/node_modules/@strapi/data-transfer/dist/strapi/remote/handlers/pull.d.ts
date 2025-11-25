/// <reference types="node" />
/// <reference types="koa" />
import { Readable } from 'stream';
import { Handler } from './abstract';
import { ILocalStrapiSourceProvider } from '../../providers';
import type { TransferStage, Protocol } from '../../../../types';
declare const VALID_TRANSFER_ACTIONS: readonly ["bootstrap", "close", "getMetadata", "getSchemas"];
type PullTransferAction = (typeof VALID_TRANSFER_ACTIONS)[number];
export interface PullHandler extends Handler {
    provider?: ILocalStrapiSourceProvider;
    streams?: {
        [stage in TransferStage]?: Readable;
    };
    assertValidTransferAction(action: string): asserts action is PullTransferAction;
    onTransferMessage(msg: Protocol.Client.TransferMessage): Promise<unknown> | unknown;
    onTransferAction(msg: Protocol.Client.Action): Promise<unknown> | unknown;
    onTransferStep(msg: Protocol.Client.TransferPullMessage): Promise<unknown> | unknown;
    createReadableStreamForStep(step: TransferStage): Promise<void>;
    flush(stage: TransferStage, id: string): Promise<void> | void;
}
export declare const createPullController: (options: import("./utils").HandlerOptions) => (ctx: import("koa").Context) => Promise<void>;
export {};
//# sourceMappingURL=pull.d.ts.map