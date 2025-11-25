'use strict';

var fp = require('lodash/fp');
var dataTransfer$1 = require('@strapi/data-transfer');
var dataTransfer = require('../../utils/data-transfer.js');
var helpers = require('../../utils/helpers.js');

const { createTransferEngine } = dataTransfer$1.engine;
const { providers: { createRemoteStrapiDestinationProvider, createLocalStrapiSourceProvider, createLocalStrapiDestinationProvider, createRemoteStrapiSourceProvider } } = dataTransfer$1.strapi;
/**
 * Transfer command.
 *
 * Transfers data between local Strapi and remote Strapi instances
 */ var action = (async (opts)=>{
    // Validate inputs from Commander
    if (!fp.isObject(opts)) {
        helpers.exitWith(1, 'Could not parse command arguments');
    }
    if (!(opts.from || opts.to) || opts.from && opts.to) {
        helpers.exitWith(1, 'Exactly one source (from) or destination (to) option must be provided');
    }
    const strapi = await dataTransfer.createStrapiInstance();
    let source;
    let destination;
    // if no URL provided, use local Strapi
    if (!opts.from) {
        source = createLocalStrapiSourceProvider({
            getStrapi: ()=>strapi
        });
    } else {
        if (!opts.fromToken) {
            helpers.exitWith(1, 'Missing token for remote destination');
        }
        source = createRemoteStrapiSourceProvider({
            getStrapi: ()=>strapi,
            url: opts.from,
            auth: {
                type: 'token',
                token: opts.fromToken
            }
        });
    }
    // if no URL provided, use local Strapi
    if (!opts.to) {
        destination = createLocalStrapiDestinationProvider({
            getStrapi: ()=>strapi,
            strategy: 'restore',
            restore: dataTransfer.parseRestoreFromOptions(opts)
        });
    } else {
        if (!opts.toToken) {
            helpers.exitWith(1, 'Missing token for remote destination');
        }
        destination = createRemoteStrapiDestinationProvider({
            url: opts.to,
            auth: {
                type: 'token',
                token: opts.toToken
            },
            strategy: 'restore',
            restore: dataTransfer.parseRestoreFromOptions(opts)
        });
    }
    if (!source || !destination) {
        helpers.exitWith(1, 'Could not create providers');
    }
    const engine = createTransferEngine(source, destination, {
        versionStrategy: 'exact',
        schemaStrategy: 'strict',
        exclude: opts.exclude,
        only: opts.only,
        throttle: opts.throttle,
        transforms: {
            links: [
                {
                    filter (link) {
                        return !dataTransfer.DEFAULT_IGNORED_CONTENT_TYPES.includes(link.left.type) && !dataTransfer.DEFAULT_IGNORED_CONTENT_TYPES.includes(link.right.type);
                    }
                }
            ],
            entities: [
                {
                    filter (entity) {
                        return !dataTransfer.DEFAULT_IGNORED_CONTENT_TYPES.includes(entity.type);
                    }
                }
            ]
        }
    });
    engine.diagnostics.onDiagnostic(dataTransfer.formatDiagnostic('transfer', opts.verbose));
    const progress = engine.progress.stream;
    const { updateLoader } = dataTransfer.loadersFactory();
    engine.onSchemaDiff(dataTransfer.getDiffHandler(engine, {
        force: opts.force,
        action: 'transfer'
    }));
    engine.addErrorHandler('ASSETS_DIRECTORY_ERR', dataTransfer.getAssetsBackupHandler(engine, {
        force: opts.force,
        action: 'transfer'
    }));
    progress.on(`stage::start`, ({ stage, data })=>{
        updateLoader(stage, data).start();
    });
    progress.on('stage::finish', ({ stage, data })=>{
        updateLoader(stage, data).succeed();
    });
    progress.on('stage::progress', ({ stage, data })=>{
        updateLoader(stage, data);
    });
    progress.on('stage::error', ({ stage, data })=>{
        updateLoader(stage, data).fail();
    });
    progress.on('transfer::start', async ()=>{
        console.log(`Starting transfer...`);
        await strapi.telemetry.send('didDEITSProcessStart', dataTransfer.getTransferTelemetryPayload(engine));
    });
    let results;
    try {
        // Abort transfer if user interrupts process
        dataTransfer.setSignalHandler(()=>dataTransfer.abortTransfer({
                engine,
                strapi
            }));
        results = await engine.transfer();
        // Note: we need to await telemetry or else the process ends before it is sent
        await strapi.telemetry.send('didDEITSProcessFinish', dataTransfer.getTransferTelemetryPayload(engine));
        try {
            const table = dataTransfer.buildTransferTable(results.engine);
            console.log(table?.toString());
        } catch (e) {
            console.error('There was an error displaying the results of the transfer.');
        }
        helpers.exitWith(0, dataTransfer.exitMessageText('transfer'));
    } catch (e) {
        await strapi.telemetry.send('didDEITSProcessFail', dataTransfer.getTransferTelemetryPayload(engine));
        helpers.exitWith(1, dataTransfer.exitMessageText('transfer', true));
    }
});

module.exports = action;
//# sourceMappingURL=action.js.map
