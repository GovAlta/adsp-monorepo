'use strict';

var crypto = require('crypto');
var ws = require('ws');
var providers = require('../../../errors/providers.js');
var constants = require('./constants.js');
var diagnostic = require('../../../utils/diagnostic.js');

const transformUpgradeHeader = (header = '')=>{
    return header.split(',').map((s)=>s.trim().toLowerCase());
};
let timeouts;
const hasHttpServer = ()=>{
    // during server restarts, strapi may not have ever been defined at all, so we have to check it first
    return typeof strapi !== 'undefined' && !!strapi?.server?.httpServer;
};
// temporarily disable server timeouts while transfer is running
const disableTimeouts = ()=>{
    if (!hasHttpServer()) {
        return;
    }
    const { httpServer } = strapi.server;
    // save the original timeouts to restore after
    if (!timeouts) {
        timeouts = {
            headersTimeout: httpServer.headersTimeout,
            requestTimeout: httpServer.requestTimeout
        };
    }
    httpServer.headersTimeout = 0;
    httpServer.requestTimeout = 0;
    strapi.log.info('[Data transfer] Disabling http timeouts');
};
const resetTimeouts = ()=>{
    if (!hasHttpServer() || !timeouts) {
        return;
    }
    const { httpServer } = strapi.server;
    strapi.log.info('[Data transfer] Restoring http timeouts');
    httpServer.headersTimeout = timeouts.headersTimeout;
    httpServer.requestTimeout = timeouts.requestTimeout;
};
/**
 * Make sure that the upgrade header is a valid websocket one
 */ const assertValidHeader = (ctx)=>{
    // if it's exactly what we expect, it's fine
    if (ctx.headers.upgrade === 'websocket') {
        return;
    }
    // check if it could be an array that still includes websocket
    const upgradeHeader = transformUpgradeHeader(ctx.headers.upgrade);
    // Sanitize user input before writing it to our logs
    const logSafeUpgradeHeader = JSON.stringify(ctx.headers.upgrade)?.replace(/[^a-z0-9\s.,|]/gi, '').substring(0, 50);
    if (!upgradeHeader.includes('websocket')) {
        throw new Error(`Transfer Upgrade header expected 'websocket', found '${logSafeUpgradeHeader}'. Please ensure that your server or proxy is not modifying the Upgrade header.`);
    }
    /**
   * If there's more than expected but it still includes websocket, in theory it could still work
   * and could be necessary for their certain configurations, so we'll allow it to proceed but
   * log the unexpected behaviour in case it helps debug an issue
   * */ strapi.log.info(`Transfer Upgrade header expected only 'websocket', found unexpected values: ${logSafeUpgradeHeader}`);
};
const isDataTransferMessage = (message)=>{
    if (!message || typeof message !== 'object') {
        return false;
    }
    const { uuid, type } = message;
    if (typeof uuid !== 'string' || typeof type !== 'string') {
        return false;
    }
    if (![
        'command',
        'transfer'
    ].includes(type)) {
        return false;
    }
    return true;
};
/**
 * Handle the upgrade to ws connection
 */ const handleWSUpgrade = (wss, ctx, callback)=>{
    assertValidHeader(ctx);
    wss.handleUpgrade(ctx.req, ctx.request.socket, Buffer.alloc(0), (client, request)=>{
        if (!client) {
            // If the WebSocket upgrade failed, destroy the socket to avoid hanging
            ctx.request.socket.destroy();
            return;
        }
        disableTimeouts();
        strapi.db.lifecycles.disable();
        strapi.log.info('[Data transfer] Disabling lifecycle hooks');
        // Create a connection between the client & the server
        wss.emit('connection', client, ctx.req);
        // Invoke the ws callback
        callback(client, request);
    });
    ctx.respond = false;
};
// Protocol related functions
const handlerControllerFactory = (implementation)=>(options)=>{
        const { verify, server: serverOptions } = options ?? {};
        const wss = new ws.WebSocket.Server({
            ...serverOptions,
            noServer: true
        });
        return async (ctx)=>{
            const cb = (ws)=>{
                const state = {
                    id: undefined
                };
                const messageUUIDs = new Set();
                const diagnostics = diagnostic.createDiagnosticReporter();
                const cannotRespondHandler = (err)=>{
                    strapi?.log?.error('[Data transfer] Cannot send error response to client, closing connection');
                    strapi?.log?.error(err);
                    try {
                        ws.terminate();
                        ctx.req.socket.destroy();
                    } catch (err) {
                        strapi?.log?.error('[Data transfer] Failed to close socket on error');
                    }
                };
                const prototype = {
                    // Transfer ID
                    get transferID () {
                        return state.id;
                    },
                    set transferID (id){
                        state.id = id;
                    },
                    // Started at
                    get startedAt () {
                        return state.startedAt;
                    },
                    set startedAt (timestamp){
                        state.startedAt = timestamp;
                    },
                    get response () {
                        return state.response;
                    },
                    set response (response){
                        state.response = response;
                    },
                    get diagnostics () {
                        return diagnostics;
                    },
                    addUUID (uuid) {
                        messageUUIDs.add(uuid);
                    },
                    hasUUID (uuid) {
                        return messageUUIDs.has(uuid);
                    },
                    isTransferStarted () {
                        return this.transferID !== undefined && this.startedAt !== undefined;
                    },
                    assertValidTransfer () {
                        const isStarted = this.isTransferStarted();
                        if (!isStarted) {
                            throw new Error('Invalid Transfer Process');
                        }
                    },
                    assertValidTransferCommand (command) {
                        const isDefined = typeof this[command] === 'function';
                        const isValidTransferCommand = constants.VALID_TRANSFER_COMMANDS.includes(command);
                        if (!isDefined || !isValidTransferCommand) {
                            throw new Error('Invalid transfer command');
                        }
                    },
                    async respond (uuid, e, data) {
                        let details = {};
                        return new Promise((resolve, reject)=>{
                            if (!uuid && !e) {
                                reject(new Error('Missing uuid for this message'));
                                return;
                            }
                            this.response = {
                                uuid,
                                data,
                                e
                            };
                            if (e instanceof providers.ProviderError) {
                                details = e.details;
                            }
                            const payload = JSON.stringify({
                                uuid,
                                data: data ?? null,
                                error: e ? {
                                    code: e?.name ?? 'ERR',
                                    message: e?.message,
                                    details
                                } : null
                            });
                            this.send(payload, (error)=>error ? reject(error) : resolve());
                        });
                    },
                    send (message, cb) {
                        ws.send(message, cb);
                    },
                    confirm (message) {
                        return new Promise((resolve, reject)=>{
                            const uuid = crypto.randomUUID();
                            const payload = JSON.stringify({
                                uuid,
                                data: message
                            });
                            this.send(payload, (error)=>{
                                if (error) {
                                    reject(error);
                                }
                            });
                            const onResponse = (raw)=>{
                                const response1 = JSON.parse(raw.toString());
                                if (response1.uuid === uuid) {
                                    resolve(response1.data ?? null);
                                } else {
                                    ws.once('message', onResponse);
                                }
                            };
                            ws.once('message', onResponse);
                        });
                    },
                    async executeAndRespond (uuid, fn) {
                        try {
                            const response1 = await fn();
                            await this.respond(uuid, null, response1);
                        } catch (e) {
                            if (e instanceof Error) {
                                await this.respond(uuid, e).catch(cannotRespondHandler);
                            } else if (typeof e === 'string') {
                                await this.respond(uuid, new providers.ProviderTransferError(e)).catch(cannotRespondHandler);
                            } else {
                                await this.respond(uuid, new providers.ProviderTransferError('Unexpected error', {
                                    error: e
                                })).catch(cannotRespondHandler);
                            }
                        }
                    },
                    cleanup () {
                        this.transferID = undefined;
                        this.startedAt = undefined;
                        this.response = undefined;
                    },
                    teardown () {
                        this.cleanup();
                    },
                    verifyAuth (scope) {
                        return verify(ctx, scope);
                    },
                    // Transfer commands
                    init () {},
                    end () {},
                    status () {},
                    // Default prototype implementation for events
                    onMessage () {},
                    onError () {},
                    onClose () {},
                    onInfo () {},
                    onWarning () {}
                };
                const handler = Object.assign(Object.create(prototype), implementation(prototype));
                // Bind ws events to handler methods
                ws.on('close', async (...args)=>{
                    try {
                        await handler.onClose(...args);
                    } catch (err) {
                        strapi?.log?.error('[Data transfer] Uncaught error closing connection');
                        strapi?.log?.error(err);
                        cannotRespondHandler(err);
                    } finally{
                        resetTimeouts();
                        strapi.db.lifecycles.enable();
                        strapi.log.info('[Data transfer] Restoring lifecycle hooks');
                    }
                });
                ws.on('error', async (...args)=>{
                    try {
                        await handler.onError(...args);
                    } catch (err) {
                        strapi?.log?.error('[Data transfer] Uncaught error in error handling');
                        strapi?.log?.error(err);
                        cannotRespondHandler(err);
                    }
                });
                ws.on('message', async (...args)=>{
                    try {
                        await handler.onMessage(...args);
                    } catch (err) {
                        strapi?.log?.error('[Data transfer] Uncaught error in message handling');
                        strapi?.log?.error(err);
                        cannotRespondHandler(err);
                    }
                });
                diagnostics.onDiagnostic((diagnostic)=>{
                    const uuid = crypto.randomUUID();
                    const payload = JSON.stringify({
                        diagnostic,
                        uuid
                    });
                    handler.send(payload);
                });
            };
            try {
                handleWSUpgrade(wss, ctx, cb);
            } catch (err) {
                strapi?.log?.error('[Data transfer] Error in websocket upgrade request');
                strapi?.log?.error(err);
            }
        };
    };

exports.assertValidHeader = assertValidHeader;
exports.handleWSUpgrade = handleWSUpgrade;
exports.handlerControllerFactory = handlerControllerFactory;
exports.isDataTransferMessage = isDataTransferMessage;
exports.transformUpgradeHeader = transformUpgradeHeader;
//# sourceMappingURL=utils.js.map
