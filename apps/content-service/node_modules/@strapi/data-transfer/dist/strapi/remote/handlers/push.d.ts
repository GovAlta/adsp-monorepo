/// <reference types="node" />
/// <reference types="koa" />
import { Writable, PassThrough } from 'stream';
import type { TransferFlow } from '../flows';
import type { TransferStage, IAsset, Protocol } from '../../../../types';
import { createLocalStrapiDestinationProvider } from '../../providers';
import { Handler } from './abstract';
declare const VALID_TRANSFER_ACTIONS: readonly ["bootstrap", "close", "rollback", "beforeTransfer", "getMetadata", "getSchemas"];
type PushTransferAction = (typeof VALID_TRANSFER_ACTIONS)[number];
export interface PushHandler extends Handler {
    /**
     * Local Strapi Destination Provider used to write data to the current Strapi instance
     */
    provider?: ReturnType<typeof createLocalStrapiDestinationProvider>;
    /**
     * Holds all the stages' stream for the current transfer handler (one registry per connection)
     */
    streams?: {
        [stage in TransferStage]?: Writable;
    };
    stats: {
        [stage in Exclude<TransferStage, 'schemas'>]: Protocol.Client.Stats;
    };
    /**
     * Holds all the transferred assets for the current transfer handler (one registry per connection)
     */
    assets: {
        [filepath: string]: IAsset & {
            stream: PassThrough;
        };
    };
    /**
     * Ochestrate and manage the transfer messages' ordering
     */
    flow?: TransferFlow;
    /**
     * Checks that the given action is a valid push transfer action
     */
    assertValidTransferAction(action: string): asserts action is PushTransferAction;
    /**
     * Create a new writable stream for the given step in the handler's stream registry
     */
    createWritableStreamForStep(step: TransferStage): Promise<void>;
    /**
     * Simple override of the auth verification
     */
    verifyAuth(): Promise<void>;
    /**
     * Callback when receiving a regular transfer message
     */
    onTransferMessage(msg: Protocol.Client.TransferMessage): Promise<unknown> | unknown;
    /**
     * Callback when receiving a transfer action message
     */
    onTransferAction(msg: Protocol.Client.Action): Promise<unknown> | unknown;
    /**
     * Callback when receiving a transfer step message
     */
    onTransferStep(msg: Protocol.Client.TransferPushMessage): Promise<unknown> | unknown;
    /**
     * Start streaming an asset
     */
    streamAsset(this: PushHandler, payload: Protocol.Client.GetTransferPushStreamData<'assets'>): Promise<void>;
    /**
     * Try to move to a specific transfer stage & lock the step
     */
    lockTransferStep(stage: TransferStage): void;
    /**
     * Try to move to unlock the current step
     */
    unlockTransferStep(stage: TransferStage): void;
    /**
     * Checks whether it's possible to stream a chunk for the given stage
     */
    assertValidStreamTransferStep(stage: TransferStage): void;
}
export declare const createPushController: (options: import("./utils").HandlerOptions) => (ctx: import("koa").Context) => Promise<void>;
export {};
//# sourceMappingURL=push.d.ts.map