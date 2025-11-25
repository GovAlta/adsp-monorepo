import { randomUUID } from 'crypto';
import { Writable } from 'stream';
import { once } from 'lodash/fp';
import { trimTrailingSlash, connectToWebsocket, createDispatcher } from '../utils.mjs';
import { TRANSFER_PATH } from '../../remote/constants.mjs';
import { ProviderTransferError, ProviderValidationError } from '../../../errors/providers.mjs';

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
const jsonLength = (obj)=>Buffer.byteLength(JSON.stringify(obj));
var _diagnostics = /*#__PURE__*/ _class_private_field_loose_key("_diagnostics"), _startStepOnce = /*#__PURE__*/ _class_private_field_loose_key("_startStepOnce"), _startStep = /*#__PURE__*/ _class_private_field_loose_key("_startStep"), _endStep = /*#__PURE__*/ _class_private_field_loose_key("_endStep"), _streamStep = /*#__PURE__*/ _class_private_field_loose_key("_streamStep"), _writeStream = /*#__PURE__*/ _class_private_field_loose_key("_writeStream"), _reportInfo = /*#__PURE__*/ _class_private_field_loose_key("_reportInfo");
class RemoteStrapiDestinationProvider {
    resetStats() {
        this.stats = {
            assets: {
                count: 0
            },
            entities: {
                count: 0
            },
            links: {
                count: 0
            },
            configuration: {
                count: 0
            }
        };
    }
    async initTransfer() {
        const { strategy, restore } = this.options;
        const query = this.dispatcher?.dispatchCommand({
            command: 'init',
            params: {
                options: {
                    strategy,
                    restore
                },
                transfer: 'push'
            }
        });
        const res = await query;
        if (!res?.transferID) {
            throw new ProviderTransferError('Init failed, invalid response from the server');
        }
        this.resetStats();
        return res.transferID;
    }
    async bootstrap(diagnostics) {
        _class_private_field_loose_base(this, _diagnostics)[_diagnostics] = diagnostics;
        const { url, auth } = this.options;
        const validProtocols = [
            'https:',
            'http:'
        ];
        let ws;
        if (!validProtocols.includes(url.protocol)) {
            throw new ProviderValidationError(`Invalid protocol "${url.protocol}"`, {
                check: 'url',
                details: {
                    protocol: url.protocol,
                    validProtocols
                }
            });
        }
        const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${url.host}${trimTrailingSlash(url.pathname)}${TRANSFER_PATH}/push`;
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
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('created dispatcher');
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('initialize transfer');
        this.transferID = await this.initTransfer();
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo](`initialized transfer ${this.transferID}`);
        this.dispatcher.setTransferProperties({
            id: this.transferID,
            kind: 'push'
        });
        await this.dispatcher.dispatchTransferAction('bootstrap');
    }
    async close() {
        // Gracefully close the remote transfer process
        if (this.transferID && this.dispatcher) {
            await this.dispatcher.dispatchTransferAction('close');
            await this.dispatcher.dispatchCommand({
                command: 'end',
                params: {
                    transferID: this.transferID
                }
            });
        }
        await new Promise((resolve)=>{
            const { ws } = this;
            if (!ws || ws.CLOSED) {
                resolve();
                return;
            }
            ws.on('close', ()=>resolve()).close();
        });
    }
    getMetadata() {
        return this.dispatcher?.dispatchTransferAction('getMetadata') ?? null;
    }
    async beforeTransfer() {
        await this.dispatcher?.dispatchTransferAction('beforeTransfer');
    }
    async rollback() {
        await this.dispatcher?.dispatchTransferAction('rollback');
    }
    getSchemas() {
        if (!this.dispatcher) {
            return Promise.resolve(null);
        }
        return this.dispatcher.dispatchTransferAction('getSchemas');
    }
    createEntitiesWriteStream() {
        return _class_private_field_loose_base(this, _writeStream)[_writeStream]('entities');
    }
    createLinksWriteStream() {
        return _class_private_field_loose_base(this, _writeStream)[_writeStream]('links');
    }
    createConfigurationWriteStream() {
        return _class_private_field_loose_base(this, _writeStream)[_writeStream]('configuration');
    }
    createAssetsWriteStream() {
        let batch = [];
        let hasStarted = false;
        const batchSize = 1024 * 1024; // 1MB;
        const batchLength = ()=>{
            return batch.reduce((acc, chunk)=>chunk.action === 'stream' ? acc + chunk.data.byteLength : acc, 0);
        };
        const startAssetsTransferOnce = _class_private_field_loose_base(this, _startStepOnce)[_startStepOnce]('assets');
        const flush = async ()=>{
            const streamError = await _class_private_field_loose_base(this, _streamStep)[_streamStep]('assets', batch);
            batch = [];
            return streamError;
        };
        const safePush = async (chunk)=>{
            batch.push(chunk);
            if (batchLength() >= batchSize) {
                const streamError = await flush();
                if (streamError) {
                    throw streamError;
                }
            }
        };
        return new Writable({
            objectMode: true,
            final: async (callback)=>{
                if (batch.length > 0) {
                    await flush();
                }
                if (hasStarted) {
                    const { error: endStepError } = await _class_private_field_loose_base(this, _endStep)[_endStep]('assets');
                    if (endStepError) {
                        return callback(endStepError);
                    }
                }
                return callback(null);
            },
            async write (asset, _encoding, callback) {
                const startError = await startAssetsTransferOnce();
                if (startError) {
                    return callback(startError);
                }
                hasStarted = true;
                const assetID = randomUUID();
                const { filename, filepath, stats, stream, metadata } = asset;
                try {
                    await safePush({
                        action: 'start',
                        assetID,
                        data: {
                            filename,
                            filepath,
                            stats,
                            metadata
                        }
                    });
                    for await (const chunk of stream){
                        await safePush({
                            action: 'stream',
                            assetID,
                            data: chunk
                        });
                    }
                    await safePush({
                        action: 'end',
                        assetID
                    });
                    callback();
                } catch (error) {
                    if (error instanceof Error) {
                        callback(error);
                    }
                }
            }
        });
    }
    constructor(options){
        Object.defineProperty(this, _startStepOnce, {
            value: startStepOnce
        });
        Object.defineProperty(this, _startStep, {
            value: startStep
        });
        Object.defineProperty(this, _endStep, {
            value: endStep
        });
        Object.defineProperty(this, _streamStep, {
            value: streamStep
        });
        Object.defineProperty(this, _writeStream, {
            value: writeStream
        });
        Object.defineProperty(this, _reportInfo, {
            value: reportInfo
        });
        Object.defineProperty(this, _diagnostics, {
            writable: true,
            value: void 0
        });
        this.name = 'destination::remote-strapi';
        this.type = 'destination';
        this.options = options;
        this.ws = null;
        this.dispatcher = null;
        this.transferID = null;
        this.resetStats();
    }
}
function startStepOnce(stage) {
    return once(()=>_class_private_field_loose_base(this, _startStep)[_startStep](stage));
}
async function startStep(step) {
    try {
        await this.dispatcher?.dispatchTransferStep({
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
    this.stats[step] = {
        count: 0
    };
    return null;
}
async function endStep(step) {
    try {
        const res = await this.dispatcher?.dispatchTransferStep({
            action: 'end',
            step
        });
        return {
            stats: res?.stats ?? null,
            error: null
        };
    } catch (e) {
        if (e instanceof Error) {
            return {
                stats: null,
                error: e
            };
        }
        if (typeof e === 'string') {
            return {
                stats: null,
                error: new ProviderTransferError(e)
            };
        }
        return {
            stats: null,
            error: new ProviderTransferError('Unexpected error')
        };
    }
}
async function streamStep(step, message) {
    try {
        if (step === 'assets') {
            const assetMessage = message;
            this.stats[step].count += assetMessage.filter((data)=>data.action === 'start').length;
        } else {
            this.stats[step].count += message.length;
        }
        await this.dispatcher?.dispatchTransferStep({
            action: 'stream',
            step,
            data: message
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
function writeStream(step) {
    const batchSize = 1024 * 1024; // 1MB;
    const startTransferOnce = _class_private_field_loose_base(this, _startStepOnce)[_startStepOnce](step);
    let batch = [];
    const batchLength = ()=>jsonLength(batch);
    return new Writable({
        objectMode: true,
        final: async (callback)=>{
            if (batch.length > 0) {
                const streamError = await _class_private_field_loose_base(this, _streamStep)[_streamStep](step, batch);
                batch = [];
                if (streamError) {
                    return callback(streamError);
                }
            }
            const { error, stats } = await _class_private_field_loose_base(this, _endStep)[_endStep](step);
            const { count } = this.stats[step];
            if (stats && (stats.started !== count || stats.finished !== count)) {
                callback(new Error(`Data missing: sent ${this.stats[step].count} ${step}, recieved ${stats.started} and saved ${stats.finished} ${step}`));
            }
            callback(error);
        },
        write: async (chunk, _encoding, callback)=>{
            const startError = await startTransferOnce();
            if (startError) {
                return callback(startError);
            }
            batch.push(chunk);
            if (batchLength() >= batchSize) {
                const streamError = await _class_private_field_loose_base(this, _streamStep)[_streamStep](step, batch);
                batch = [];
                if (streamError) {
                    return callback(streamError);
                }
            }
            callback();
        }
    });
}
function reportInfo(message) {
    _class_private_field_loose_base(this, _diagnostics)[_diagnostics]?.report({
        details: {
            createdAt: new Date(),
            message,
            origin: 'remote-destination-provider'
        },
        kind: 'info'
    });
}
const createRemoteStrapiDestinationProvider = (options)=>{
    return new RemoteStrapiDestinationProvider(options);
};

export { createRemoteStrapiDestinationProvider };
//# sourceMappingURL=index.mjs.map
