import { isObject } from 'lodash/fp';
import { engine, strapi } from '@strapi/data-transfer';
import { createStrapiInstance, parseRestoreFromOptions, DEFAULT_IGNORED_CONTENT_TYPES, formatDiagnostic, getDiffHandler, getAssetsBackupHandler, getTransferTelemetryPayload, setSignalHandler, abortTransfer, buildTransferTable, exitMessageText, loadersFactory } from '../../utils/data-transfer.mjs';
import { exitWith } from '../../utils/helpers.mjs';

const { createTransferEngine } = engine;
const { providers: { createRemoteStrapiDestinationProvider, createLocalStrapiSourceProvider, createLocalStrapiDestinationProvider, createRemoteStrapiSourceProvider } } = strapi;
/**
 * Transfer command.
 *
 * Transfers data between local Strapi and remote Strapi instances
 */ var action = (async (opts)=>{
    // Validate inputs from Commander
    if (!isObject(opts)) {
        exitWith(1, 'Could not parse command arguments');
    }
    if (!(opts.from || opts.to) || opts.from && opts.to) {
        exitWith(1, 'Exactly one source (from) or destination (to) option must be provided');
    }
    const strapi = await createStrapiInstance();
    let source;
    let destination;
    // if no URL provided, use local Strapi
    if (!opts.from) {
        source = createLocalStrapiSourceProvider({
            getStrapi: ()=>strapi
        });
    } else {
        if (!opts.fromToken) {
            exitWith(1, 'Missing token for remote destination');
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
            restore: parseRestoreFromOptions(opts)
        });
    } else {
        if (!opts.toToken) {
            exitWith(1, 'Missing token for remote destination');
        }
        destination = createRemoteStrapiDestinationProvider({
            url: opts.to,
            auth: {
                type: 'token',
                token: opts.toToken
            },
            strategy: 'restore',
            restore: parseRestoreFromOptions(opts)
        });
    }
    if (!source || !destination) {
        exitWith(1, 'Could not create providers');
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
                        return !DEFAULT_IGNORED_CONTENT_TYPES.includes(link.left.type) && !DEFAULT_IGNORED_CONTENT_TYPES.includes(link.right.type);
                    }
                }
            ],
            entities: [
                {
                    filter (entity) {
                        return !DEFAULT_IGNORED_CONTENT_TYPES.includes(entity.type);
                    }
                }
            ]
        }
    });
    engine.diagnostics.onDiagnostic(formatDiagnostic('transfer', opts.verbose));
    const progress = engine.progress.stream;
    const { updateLoader } = loadersFactory();
    engine.onSchemaDiff(getDiffHandler(engine, {
        force: opts.force,
        action: 'transfer'
    }));
    engine.addErrorHandler('ASSETS_DIRECTORY_ERR', getAssetsBackupHandler(engine, {
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
        await strapi.telemetry.send('didDEITSProcessStart', getTransferTelemetryPayload(engine));
    });
    let results;
    try {
        // Abort transfer if user interrupts process
        setSignalHandler(()=>abortTransfer({
                engine,
                strapi
            }));
        results = await engine.transfer();
        // Note: we need to await telemetry or else the process ends before it is sent
        await strapi.telemetry.send('didDEITSProcessFinish', getTransferTelemetryPayload(engine));
        try {
            const table = buildTransferTable(results.engine);
            console.log(table?.toString());
        } catch (e) {
            console.error('There was an error displaying the results of the transfer.');
        }
        exitWith(0, exitMessageText('transfer'));
    } catch (e) {
        await strapi.telemetry.send('didDEITSProcessFail', getTransferTelemetryPayload(engine));
        exitWith(1, exitMessageText('transfer', true));
    }
});

export { action as default };
//# sourceMappingURL=action.mjs.map
