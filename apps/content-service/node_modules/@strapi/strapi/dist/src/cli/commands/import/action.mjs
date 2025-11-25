import { isObject } from 'lodash/fp';
import chalk from 'chalk';
import { file, strapi as strapi$1, engine } from '@strapi/data-transfer';
import { createStrapiInstance, DEFAULT_IGNORED_CONTENT_TYPES, parseRestoreFromOptions, formatDiagnostic, getDiffHandler, getTransferTelemetryPayload, setSignalHandler, abortTransfer, buildTransferTable, exitMessageText, loadersFactory } from '../../utils/data-transfer.mjs';
import { exitWith } from '../../utils/helpers.mjs';

const { providers: { createLocalFileSourceProvider } } = file;
const { providers: { createLocalStrapiDestinationProvider, DEFAULT_CONFLICT_STRATEGY } } = strapi$1;
const { createTransferEngine, DEFAULT_VERSION_STRATEGY, DEFAULT_SCHEMA_STRATEGY } = engine;
/**
 * Import command.
 *
 * It transfers data from a file to a local Strapi instance
 */ var action = (async (opts)=>{
    // validate inputs from Commander
    if (!isObject(opts)) {
        exitWith(1, 'Could not parse arguments');
    }
    /**
   * From strapi backup file
   */ const sourceOptions = getLocalFileSourceOptions(opts);
    const source = createLocalFileSourceProvider(sourceOptions);
    /**
   * To local Strapi instance
   */ const strapiInstance = await createStrapiInstance();
    /**
   * Configure and run the transfer engine
   */ const engineOptions = {
        versionStrategy: DEFAULT_VERSION_STRATEGY,
        schemaStrategy: DEFAULT_SCHEMA_STRATEGY,
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
                    filter: (entity)=>!DEFAULT_IGNORED_CONTENT_TYPES.includes(entity.type)
                }
            ]
        }
    };
    const destinationOptions = {
        async getStrapi () {
            return strapiInstance;
        },
        autoDestroy: false,
        strategy: opts.conflictStrategy || DEFAULT_CONFLICT_STRATEGY,
        restore: parseRestoreFromOptions(engineOptions)
    };
    const destination = createLocalStrapiDestinationProvider(destinationOptions);
    destination.onWarning = (message)=>console.warn(`\n${chalk.yellow('warn')}: ${message}`);
    const engine = createTransferEngine(source, destination, engineOptions);
    engine.diagnostics.onDiagnostic(formatDiagnostic('import', opts.verbose));
    const progress = engine.progress.stream;
    const { updateLoader } = loadersFactory();
    engine.onSchemaDiff(getDiffHandler(engine, {
        force: opts.force,
        action: 'import'
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
    progress.on('transfer::start', async ()=>{
        console.log('Starting import...');
        await strapiInstance.telemetry.send('didDEITSProcessStart', getTransferTelemetryPayload(engine));
    });
    let results;
    try {
        // Abort transfer if user interrupts process
        setSignalHandler(()=>abortTransfer({
                engine,
                strapi: strapi
            }));
        results = await engine.transfer();
        try {
            const table = buildTransferTable(results.engine);
            console.log(table?.toString());
        } catch (e) {
            console.error('There was an error displaying the results of the transfer.');
        }
        // Note: we need to await telemetry or else the process ends before it is sent
        await strapiInstance.telemetry.send('didDEITSProcessFinish', getTransferTelemetryPayload(engine));
        await strapiInstance.destroy();
        exitWith(0, exitMessageText('import'));
    } catch (e) {
        await strapiInstance.telemetry.send('didDEITSProcessFail', getTransferTelemetryPayload(engine));
        exitWith(1, exitMessageText('import', true));
    }
});
/**
 * Infer local file source provider options based on a given filename
 */ const getLocalFileSourceOptions = (opts)=>{
    const options = {
        file: {
            path: opts.file ?? ''
        },
        compression: {
            enabled: !!opts.decompress
        },
        encryption: {
            enabled: !!opts.decrypt,
            key: opts.key
        }
    };
    return options;
};

export { action as default };
//# sourceMappingURL=action.mjs.map
