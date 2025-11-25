'use strict';

var fp = require('lodash/fp');
var fse = require('fs-extra');
var chalk = require('chalk');
var dataTransfer$1 = require('@strapi/data-transfer');
var dataTransfer = require('../../utils/data-transfer.js');
var helpers = require('../../utils/helpers.js');

const { providers: { createLocalFileDestinationProvider } } = dataTransfer$1.file;
const { providers: { createLocalStrapiSourceProvider } } = dataTransfer$1.strapi;
const BYTES_IN_MB = 1024 * 1024;
/**
 * Export command.
 *
 * It transfers data from a local Strapi instance to a file
 *
 * @param {ExportCommandOptions} opts
 */ var action = (async (opts)=>{
    // Validate inputs from Commander
    if (!fp.isObject(opts)) {
        helpers.exitWith(1, 'Could not parse command arguments');
    }
    const strapi = await dataTransfer.createStrapiInstance();
    const source = createSourceProvider(strapi);
    const destination = createDestinationProvider(opts);
    const engine = dataTransfer$1.engine.createTransferEngine(source, destination, {
        versionStrategy: 'ignore',
        schemaStrategy: 'ignore',
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
    engine.diagnostics.onDiagnostic(dataTransfer.formatDiagnostic('export', opts.verbose));
    const progress = engine.progress.stream;
    const { updateLoader } = dataTransfer.loadersFactory();
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
        await strapi.telemetry.send('didDEITSProcessStart', dataTransfer.getTransferTelemetryPayload(engine));
    });
    let results;
    let outFile;
    try {
        // Abort transfer if user interrupts process
        dataTransfer.setSignalHandler(()=>dataTransfer.abortTransfer({
                engine,
                strapi
            }));
        results = await engine.transfer();
        outFile = results.destination?.file?.path ?? '';
        const outFileExists = await fse.pathExists(outFile);
        if (!outFileExists) {
            throw new dataTransfer$1.engine.errors.TransferEngineTransferError(`Export file not created "${outFile}"`);
        }
        // Note: we need to await telemetry or else the process ends before it is sent
        await strapi.telemetry.send('didDEITSProcessFinish', dataTransfer.getTransferTelemetryPayload(engine));
        try {
            const table = dataTransfer.buildTransferTable(results.engine);
            console.log(table?.toString());
        } catch (e) {
            console.error('There was an error displaying the results of the transfer.');
        }
        console.log(`Export archive is in ${chalk.green(outFile)}`);
        helpers.exitWith(0, dataTransfer.exitMessageText('export'));
    } catch  {
        await strapi.telemetry.send('didDEITSProcessFail', dataTransfer.getTransferTelemetryPayload(engine));
        helpers.exitWith(1, dataTransfer.exitMessageText('export', true));
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
    const filepath = fp.isString(file) && file.length > 0 ? file : dataTransfer.getDefaultExportName();
    const maxSizeJsonlInMb = fp.isFinite(fp.toNumber(maxSizeJsonl)) ? fp.toNumber(maxSizeJsonl) * BYTES_IN_MB : undefined;
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

module.exports = action;
//# sourceMappingURL=action.js.map
