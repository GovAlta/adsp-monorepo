import { PassThrough } from 'stream';
import { castArray } from 'lodash/fp';
import { ProviderValidationError, ProviderTransferError } from '../../../errors/providers.mjs';
import { TRANSFER_PATH } from '../../remote/constants.mjs';
import { trimTrailingSlash, connectToWebsocket, createDispatcher } from '../utils.mjs';

function _class_private_field_loose_base(receiver, privateKey) {
    if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
        throw new TypeError("attempted to use private field on non-instance");
    }
    return receiver;
}
var id = 0;
function _class_private_field_loose_key(name) {
    return "__private_" + id++ + "_" + name;
}
var _diagnostics = /*#__PURE__*/ _class_private_field_loose_key("_diagnostics"), _createStageReadStream = /*#__PURE__*/ _class_private_field_loose_key("_createStageReadStream"), _reportInfo = /*#__PURE__*/ _class_private_field_loose_key("_reportInfo"), _startStep = /*#__PURE__*/ _class_private_field_loose_key("_startStep"), _respond = /*#__PURE__*/ _class_private_field_loose_key("_respond"), _endStep = /*#__PURE__*/ _class_private_field_loose_key("_endStep");
class RemoteStrapiSourceProvider {
    createEntitiesReadStream() {
        return _class_private_field_loose_base(this, _createStageReadStream)[_createStageReadStream]('entities');
    }
    createLinksReadStream() {
        return _class_private_field_loose_base(this, _createStageReadStream)[_createStageReadStream]('links');
    }
    async createAssetsReadStream() {
        // Create the streams used to transfer the assets
        const stream = await _class_private_field_loose_base(this, _createStageReadStream)[_createStageReadStream]('assets');
        const pass = new PassThrough({
            objectMode: true
        });
        // Init the asset map
        const assets = {};
        // Watch for stalled assets; if we don't receive a chunk within timeout, abort transfer
        const resetTimeout = (assetID)=>{
            if (assets[assetID].timeout) {
                clearTimeout(assets[assetID].timeout);
            }
            assets[assetID].timeout = setTimeout(()=>{
                _class_private_field_loose_base(this, _reportInfo)[_reportInfo](`Asset ${assetID} transfer stalled, aborting.`);
                assets[assetID].status = 'errored';
                assets[assetID].stream.destroy(new Error(`Asset ${assetID} transfer timed out`));
            }, this.options.streamTimeout);
        };
        stream/**
       * Process a payload of many transfer assets and performs the following tasks:
       * - Start: creates a stream for new assets.
       * - Stream: writes asset chunks to the asset's stream.
       * - End: closes the stream after the asset s transferred and cleanup related resources.
       */ .on('data', async (payload)=>{
            for (const item of payload){
                const { action, assetID } = item;
                // Creates the stream to send the incoming asset through
                if (action === 'start') {
                    // if a transfer has already been started for the same asset ID, something is wrong
                    if (assets[assetID]) {
                        throw new Error(`Asset ${assetID} already started`);
                    }
                    _class_private_field_loose_base(this, _reportInfo)[_reportInfo](`Asset ${assetID} starting`);
                    // Register the asset
                    assets[assetID] = {
                        ...item.data,
                        stream: new PassThrough(),
                        status: 'ok',
                        queue: []
                    };
                    resetTimeout(assetID);
                    // Connect the individual asset stream to the main asset stage stream
                    // Note: nothing is transferred until data chunks are fed to the asset stream
                    await this.writeAsync(pass, assets[assetID]);
                } else if (action === 'stream' || action === 'end') {
                    // If the asset hasn't been registered, or if it's been closed already, something is wrong
                    if (!assets[assetID]) {
                        throw new Error(`No id matching ${assetID} for stream action`);
                    }
                    // On every action, reset the timeout timer
                    if (action === 'stream') {
                        resetTimeout(assetID);
                    } else {
                        clearTimeout(assets[assetID].timeout);
                    }
                    if (assets[assetID].status === 'closed') {
                        throw new Error(`Asset ${assetID} is closed`);
                    }
                    assets[assetID].queue.push(item);
                }
            }
            // each new payload will start new processQueue calls, which may cause some extra calls
            // it's essentially saying "start processing this asset again, I added more data to the queue"
            for(const assetID in assets){
                if (Object.prototype.hasOwnProperty.call(assets, assetID)) {
                    const asset = assets[assetID];
                    if (asset.queue?.length > 0) {
                        await processQueue(assetID);
                    }
                }
            }
        }).on('close', ()=>{
            pass.end();
        });
        /**
     * Start processing the queue for a given assetID
     *
     * Even though this is a loop that attempts to process the entire queue, it is safe to call this more than once
     * for the same asset id because the queue is shared globally, the items are shifted off, and immediately written
     */ const processQueue = async (id)=>{
            if (!assets[id]) {
                throw new Error(`Failed to write asset chunk for "${id}". Asset not found.`);
            }
            const asset = assets[id];
            const { status: currentStatus } = asset;
            if ([
                'closed',
                'errored'
            ].includes(currentStatus)) {
                throw new Error(`Failed to write asset chunk for "${id}". The asset is currently "${currentStatus}"`);
            }
            while(asset.queue.length > 0){
                const data = asset.queue.shift();
                if (!data) {
                    throw new Error(`Invalid chunk found for ${id}`);
                }
                try {
                    // if this is an end chunk, close the asset stream
                    if (data.action === 'end') {
                        _class_private_field_loose_base(this, _reportInfo)[_reportInfo](`Ending asset stream for ${id}`);
                        await closeAssetStream(id);
                        break; // Exit the loop after closing the stream
                    }
                    // Save the current chunk
                    await writeChunkToStream(id, data);
                } catch  {
                    if (!assets[id]) {
                        throw new Error(`No id matching ${id} for writeAssetChunk`);
                    }
                }
            }
        };
        /**
     * Writes a chunk of data to the asset's stream.
     *
     * Only check if the targeted asset exists, no other validation is done.
     */ const writeChunkToStream = async (id, data)=>{
            const asset = assets[id];
            if (!asset) {
                throw new Error(`Failed to write asset chunk for "${id}". Asset not found.`);
            }
            const rawBuffer = data;
            const chunk = Buffer.from(rawBuffer.data);
            await this.writeAsync(asset.stream, chunk);
        };
        /**
     * Closes the asset stream associated with the given ID.
     *
     * It deletes the stream for the asset upon successful closure.
     */ const closeAssetStream = async (id)=>{
            if (!assets[id]) {
                throw new Error(`Failed to close asset "${id}". Asset not found.`);
            }
            assets[id].status = 'closed';
            await new Promise((resolve, reject)=>{
                const { stream } = assets[id];
                stream.on('close', ()=>{
                    resolve();
                }).on('error', (e)=>{
                    assets[id].status = 'errored';
                    reject(new Error(`Failed to close asset "${id}". Asset stream error: ${e.toString()}`));
                }).end();
            });
        };
        return pass;
    }
    createConfigurationReadStream() {
        return _class_private_field_loose_base(this, _createStageReadStream)[_createStageReadStream]('configuration');
    }
    async getMetadata() {
        const metadata = await this.dispatcher?.dispatchTransferAction('getMetadata');
        return metadata ?? null;
    }
    assertValidProtocol(url) {
        const validProtocols = [
            'https:',
            'http:'
        ];
        if (!validProtocols.includes(url.protocol)) {
            throw new ProviderValidationError(`Invalid protocol "${url.protocol}"`, {
                check: 'url',
                details: {
                    protocol: url.protocol,
                    validProtocols
                }
            });
        }
    }
    async initTransfer() {
        const query = this.dispatcher?.dispatchCommand({
            command: 'init'
        });
        const res = await query;
        if (!res?.transferID) {
            throw new ProviderTransferError('Init failed, invalid response from the server');
        }
        return res.transferID;
    }
    async bootstrap(diagnostics) {
        _class_private_field_loose_base(this, _diagnostics)[_diagnostics] = diagnostics;
        const { url, auth } = this.options;
        let ws;
        this.assertValidProtocol(url);
        const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${url.host}${trimTrailingSlash(url.pathname)}${TRANSFER_PATH}/pull`;
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('establishing websocket connection');
        // No auth defined, trying public access for transfer
        if (!auth) {
            ws = await connectToWebsocket(wsUrl, undefined, _class_private_field_loose_base(this, _diagnostics)[_diagnostics]);
        } else if (auth.type === 'token') {
            const headers = {
                Authorization: `Bearer ${auth.token}`
            };
            ws = await connectToWebsocket(wsUrl, {
                headers
            }, _class_private_field_loose_base(this, _diagnostics)[_diagnostics]);
        } else {
            throw new ProviderValidationError('Auth method not available', {
                check: 'auth.type',
                details: {
                    auth: auth.type
                }
            });
        }
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('established websocket connection');
        this.ws = ws;
        const { retryMessageOptions } = this.options;
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating dispatcher');
        this.dispatcher = createDispatcher(this.ws, retryMessageOptions, (message)=>_class_private_field_loose_base(this, _reportInfo)[_reportInfo](message));
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating dispatcher');
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('initialize transfer');
        const transferID = await this.initTransfer();
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo](`initialized transfer ${transferID}`);
        this.dispatcher.setTransferProperties({
            id: transferID,
            kind: 'pull'
        });
        await this.dispatcher.dispatchTransferAction('bootstrap');
    }
    async close() {
        await this.dispatcher?.dispatchTransferAction('close');
        await new Promise((resolve)=>{
            const { ws } = this;
            if (!ws || ws.CLOSED) {
                resolve();
                return;
            }
            ws.on('close', ()=>resolve()).close();
        });
    }
    async getSchemas() {
        const schemas = await this.dispatcher?.dispatchTransferAction('getSchemas');
        return schemas ?? null;
    }
    constructor(options){
        Object.defineProperty(this, _createStageReadStream, {
            value: createStageReadStream
        });
        Object.defineProperty(this, _reportInfo, {
            value: reportInfo
        });
        Object.defineProperty(this, _startStep, {
            value: startStep
        });
        Object.defineProperty(this, _respond, {
            value: respond
        });
        Object.defineProperty(this, _endStep, {
            value: endStep
        });
        Object.defineProperty(this, _diagnostics, {
            writable: true,
            value: void 0
        });
        this.name = 'source::remote-strapi';
        this.type = 'source';
        this.defaultOptions = {
            streamTimeout: 15000
        };
        this.writeAsync = (stream, data)=>{
            return new Promise((resolve, reject)=>{
                stream.write(data, (error)=>{
                    if (error) {
                        reject(error);
                    }
                    resolve();
                });
            });
        };
        this.options = {
            ...this.defaultOptions,
            ...options
        };
        this.ws = null;
        this.dispatcher = null;
    }
}
async function createStageReadStream(stage) {
    const startResult = await _class_private_field_loose_base(this, _startStep)[_startStep](stage);
    if (startResult instanceof Error) {
        throw startResult;
    }
    const { id: processID } = startResult;
    const stream = new PassThrough({
        objectMode: true
    });
    const listener = async (raw)=>{
        const parsed = JSON.parse(raw.toString());
        // If not a message related to our transfer process, ignore it
        if (!parsed.uuid || parsed?.data?.type !== 'transfer' || parsed?.data?.id !== processID) {
            this.ws?.once('message', listener);
            return;
        }
        const { uuid, data: message } = parsed;
        const { ended, error, data } = message;
        if (error) {
            await _class_private_field_loose_base(this, _respond)[_respond](uuid);
            stream.destroy(error);
            return;
        }
        if (ended) {
            await _class_private_field_loose_base(this, _respond)[_respond](uuid);
            await _class_private_field_loose_base(this, _endStep)[_endStep](stage);
            stream.end();
            return;
        }
        // if we get a single items instead of a batch
        for (const item of castArray(data)){
            stream.push(item);
        }
        this.ws?.once('message', listener);
        await _class_private_field_loose_base(this, _respond)[_respond](uuid);
    };
    this.ws?.once('message', listener);
    return stream;
}
function reportInfo(message) {
    _class_private_field_loose_base(this, _diagnostics)[_diagnostics]?.report({
        details: {
            createdAt: new Date(),
            message,
            origin: 'remote-source-provider'
        },
        kind: 'info'
    });
}
async function startStep(step) {
    try {
        return await this.dispatcher?.dispatchTransferStep({
            action: 'start',
            step
        });
    } catch (e) {
        if (e instanceof Error) {
            return e;
        }
        if (typeof e === 'string') {
            return new ProviderTransferError(e);
        }
        return new ProviderTransferError('Unexpected error');
    }
}
async function respond(uuid) {
    return new Promise((resolve, reject)=>{
        this.ws?.send(JSON.stringify({
            uuid
        }), (e)=>{
            if (e) {
                reject(e);
            } else {
                resolve(e);
            }
        });
    });
}
async function endStep(step) {
    try {
        await this.dispatcher?.dispatchTransferStep({
            action: 'end',
            step
        });
    } catch (e) {
        if (e instanceof Error) {
            return e;
        }
        if (typeof e === 'string') {
            return new ProviderTransferError(e);
        }
        return new ProviderTransferError('Unexpected error');
    }
    return null;
}
const createRemoteStrapiSourceProvider = (options)=>{
    return new RemoteStrapiSourceProvider(options);
};

export { createRemoteStrapiSourceProvider };
//# sourceMappingURL=index.mjs.map
