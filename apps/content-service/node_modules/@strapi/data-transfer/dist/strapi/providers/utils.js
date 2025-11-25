'use strict';

var crypto = require('crypto');
var ws = require('ws');
var providers = require('../../errors/providers.js');

const createDispatcher = (ws, retryMessageOptions = {
    retryMessageMaxRetries: 5,
    retryMessageTimeout: 30000
}, reportInfo)=>{
    const state = {};
    const dispatch = async (message, options = {})=>{
        if (!ws) {
            throw new Error('No websocket connection found');
        }
        return new Promise((resolve, reject)=>{
            const uuid = crypto.randomUUID();
            const payload = {
                ...message,
                uuid
            };
            let numberOfTimesMessageWasSent = 0;
            if (options.attachTransfer) {
                Object.assign(payload, {
                    transferID: state.transfer?.id
                });
            }
            if (message.type === 'command') {
                reportInfo?.(`dispatching message command:${message.command} uuid:${uuid} sent:${numberOfTimesMessageWasSent}`);
            } else if (message.type === 'transfer') {
                const messageToSend = message;
                reportInfo?.(`dispatching message action:${messageToSend.action} ${messageToSend.kind === 'step' ? `step:${messageToSend.step}` : ''} uuid:${uuid} sent:${numberOfTimesMessageWasSent}`);
            }
            const stringifiedPayload = JSON.stringify(payload);
            ws.send(stringifiedPayload, (error)=>{
                if (error) {
                    reject(error);
                }
            });
            const { retryMessageMaxRetries, retryMessageTimeout } = retryMessageOptions;
            const sendPeriodically = ()=>{
                if (numberOfTimesMessageWasSent <= retryMessageMaxRetries) {
                    numberOfTimesMessageWasSent += 1;
                    ws.send(stringifiedPayload, (error)=>{
                        if (error) {
                            reject(error);
                        }
                    });
                } else {
                    reject(new providers.ProviderError('error', 'Request timed out'));
                }
            };
            const interval = setInterval(sendPeriodically, retryMessageTimeout);
            const onResponse = (raw)=>{
                const response = JSON.parse(raw.toString());
                if (message.type === 'command') {
                    reportInfo?.(`received response to message command: ${message.command} uuid: ${uuid} sent: ${numberOfTimesMessageWasSent}`);
                } else if (message.type === 'transfer') {
                    const messageToSend = message;
                    reportInfo?.(`received response to message action:${messageToSend.action} ${messageToSend.kind === 'step' ? `step:${messageToSend.step}` : ''} uuid:${uuid} sent:${numberOfTimesMessageWasSent}`);
                }
                if (response.uuid === uuid) {
                    clearInterval(interval);
                    if (response.error) {
                        const message = response.error.message;
                        const details = response.error.details?.details;
                        const step = response.error.details?.step;
                        let error = new providers.ProviderError('error', message, details);
                        if (step === 'transfer') {
                            error = new providers.ProviderTransferError(message, details);
                        } else if (step === 'validation') {
                            error = new providers.ProviderValidationError(message, details);
                        } else if (step === 'initialization') {
                            error = new providers.ProviderInitializationError(message);
                        }
                        return reject(error);
                    }
                    resolve(response.data ?? null);
                } else {
                    ws.once('message', onResponse);
                }
            };
            ws.once('message', onResponse);
        });
    };
    const dispatchCommand = (payload)=>{
        return dispatch({
            type: 'command',
            ...payload
        });
    };
    const dispatchTransferAction = async (action)=>{
        const payload = {
            type: 'transfer',
            kind: 'action',
            action
        };
        return dispatch(payload, {
            attachTransfer: true
        }) ?? Promise.resolve(null);
    };
    const dispatchTransferStep = async (payload)=>{
        const message = {
            type: 'transfer',
            kind: 'step',
            ...payload
        };
        return dispatch(message, {
            attachTransfer: true
        }) ?? Promise.resolve(null);
    };
    const setTransferProperties = (properties)=>{
        state.transfer = {
            ...properties
        };
    };
    return {
        get transferID () {
            return state.transfer?.id;
        },
        get transferKind () {
            return state.transfer?.kind;
        },
        setTransferProperties,
        dispatch,
        dispatchCommand,
        dispatchTransferAction,
        dispatchTransferStep
    };
};
const connectToWebsocket = (address, options, diagnostics)=>{
    return new Promise((resolve, reject)=>{
        const server = new ws.WebSocket(address, options);
        server.once('open', ()=>{
            resolve(server);
        });
        server.on('unexpected-response', (_req, res)=>{
            if (res.statusCode === 401) {
                return reject(new providers.ProviderInitializationError('Failed to initialize the connection: Authentication Error'));
            }
            if (res.statusCode === 403) {
                return reject(new providers.ProviderInitializationError('Failed to initialize the connection: Authorization Error'));
            }
            if (res.statusCode === 404) {
                return reject(new providers.ProviderInitializationError('Failed to initialize the connection: Data transfer is not enabled on the remote host'));
            }
            return reject(new providers.ProviderInitializationError(`Failed to initialize the connection: Unexpected server response ${res.statusCode}`));
        });
        server.on('message', (raw)=>{
            const response = JSON.parse(raw.toString());
            if (response.diagnostic) {
                diagnostics?.report({
                    ...response.diagnostic
                });
            }
        });
        server.once('error', (err)=>{
            reject(new providers.ProviderTransferError(err.message, {
                details: {
                    error: err.message
                }
            }));
        });
    });
};
const trimTrailingSlash = (input)=>{
    return input.replace(/\/$/, '');
};

exports.connectToWebsocket = connectToWebsocket;
exports.createDispatcher = createDispatcher;
exports.trimTrailingSlash = trimTrailingSlash;
//# sourceMappingURL=utils.js.map
