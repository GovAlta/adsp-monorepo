/// <reference types="node" />
import type { IncomingMessage } from 'node:http';
import type { Context } from 'koa';
import type { ServerOptions } from 'ws';
import { WebSocket, WebSocketServer } from 'ws';
import type { Handler } from './abstract';
import type { Protocol } from '../../../../types';
import { TransferMethod } from '../constants';
type WSCallback = (client: WebSocket, request: IncomingMessage) => void;
export interface HandlerOptions {
    verify: (ctx: Context, scope?: TransferMethod) => Promise<void>;
    server?: ServerOptions;
}
export declare const transformUpgradeHeader: (header?: string) => string[];
/**
 * Make sure that the upgrade header is a valid websocket one
 */
export declare const assertValidHeader: (ctx: Context) => void;
export declare const isDataTransferMessage: (message: unknown) => message is Protocol.Client.Message;
/**
 * Handle the upgrade to ws connection
 */
export declare const handleWSUpgrade: (wss: WebSocketServer, ctx: Context, callback: WSCallback) => void;
export declare const handlerControllerFactory: <T extends Partial<Handler>>(implementation: (proto: Handler) => T) => (options: HandlerOptions) => (ctx: Context) => Promise<void>;
export {};
//# sourceMappingURL=utils.d.ts.map