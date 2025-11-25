import { isObject, isString, isFinite, toNumber } from 'lodash/fp';
import fse from 'fs-extra';
import chalk from 'chalk';
import { engine, file, strapi } from '@strapi/data-transfer';
import { createStrapiInstance, DEFAULT_IGNORED_CONTENT_TYPES, formatDiagnostic, getTransferTelemetryPayload, setSignalHandler, abortTransfer, buildTransferTable, exitMessageText, loadersFactory, getDefaultExportName } from '../../utils/data-transfer.mjs';
import { exitWith } from '../../utils/helpers.mjs';

const { providers: { createLocalFileDestinationProvider } } = file;
const { providers: { createLocalStrapiSourceProvider } } = strapi;
const BYTES_IN_MB = 1024 * 1024;
/**
 * Export command.
 *
 * It transfers data from a local Strapi instance to a file
 *
 * @param {ExportCommandOptions} opts
 */ var action = (async (opts)=>{
    // Validate inputs from Commander
    if (!isObject(opts)) {
        exitWith(1, 'Could not parse command arguments');
    }
    const strapi = await createStrapiInstance();
    const source = createSourceProvider(strapi);
    const destination = createDestinationProvider(opts);
    const engine$1 = engine.createTransferEngine(source, destination, {
        versionStrategy: 'ignore',
        schemaStrategy: 'ignore',
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
    engine$1.diagnostics.onDiagnostic(formatDiagnostic('export', opts.verbose));
    const progress = engine$1.progress.stream;
    const { updateLoader } = loadersFactory();
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
        console.log(`Starting export...`);
        await strapi.telemetry.send('didDEITSProcessStart', getTransferTelemetryPayload(engine$1));
    });
    let results;
    let outFile;
    try {
        // Abort transfer if user interrupts process
        setSignalHandler(()=>abortTransfer({
                engine: engine$1,
                strapi
            }));
        results = await engine$1.transfer();
        outFile = results.destination?.file?.path ?? '';
        const outFileExists = await fse.pathExists(outFile);
        if (!outFileExists) {
            throw new engine.errors.TransferEngineTransferError(`Export file not created "${outFile}"`);
        }
        // Note: we need to await telemetry or else the process ends before it is sent
        await strapi.telemetry.send('didDEITSProcessFinish', getTransferTelemetryPayload(engine$1));
        try {
            const table = buildTransferTable(results.engine);
            console.log(table?.toString());
        } catch (e) {
            console.error('There was an error displaying the results of the transfer.');
        }
        console.log(`Export archive is in ${chalk.green(outFile)}`);
        exitWith(0, exitMessageText('export'));
    } catch  {
        await strapi.telemetry.send('didDEITSProcessFail', getTransferTelemetryPayload(engine$1));
        exitWith(1, exitMessageText('export', true));
    }
});
/**
 * It creates a local strapi destination provider
 */ const createSourceProvider = (strapi)=>{
    return createLocalStrapiSourceProvider({
        async getStrapi () {
            return strapi;
        }
    });
};
/**
 * It creates a local file destination provider based on the given options
 */ const createDestinationProvider = (opts)=>{
    const { file, compress, encrypt, key, maxSizeJsonl } = opts;
    const filepath = isString(file) && file.length > 0 ? file : getDefaultExportName();
    const maxSizeJsonlInMb = isFinite(toNumber(maxSizeJsonl)) ? toNumber(maxSizeJsonl) * BYTES_IN_MB : undefined;
    return createLocalFileDestinationProvider({
        file: {
            path: filepath,
            maxSizeJsonl: maxSizeJsonlInMb
        },
        encryption: {
            enabled: encrypt ?? false,
            key: encrypt ? key : undefined
        },
        compression: {
            enabled: compress ?? false
        }
    });
};

export { action as default };
//# sourceMappingURL=action.mjs.map
