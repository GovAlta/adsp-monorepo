import Table from 'cli-table3';
import { Command, Option } from 'commander';
import ora from 'ora';
import type { Core } from '@strapi/types';
import { engine as engineDataTransfer } from '@strapi/data-transfer';
declare const exitMessageText: (process: string, error?: boolean) => string;
declare const getDefaultExportName: () => string;
type ResultData = engineDataTransfer.ITransferResults<engineDataTransfer.ISourceProvider, engineDataTransfer.IDestinationProvider>['engine'];
declare const buildTransferTable: (resultData: ResultData) => Table.Table | undefined;
declare const DEFAULT_IGNORED_CONTENT_TYPES: string[];
declare const abortTransfer: ({ engine, strapi, }: {
    engine: engineDataTransfer.TransferEngine;
    strapi: Core.Strapi;
}) => Promise<boolean>;
declare const setSignalHandler: (handler: (...args: unknown[]) => void, signals?: string[]) => Promise<void>;
declare const createStrapiInstance: (opts?: {
    logLevel?: string;
}) => Promise<Core.Strapi>;
declare const throttleOption: Option;
declare const excludeOption: Option;
declare const onlyOption: Option;
declare const validateExcludeOnly: (command: Command) => void;
declare const formatDiagnostic: (operation: string, info?: boolean) => Parameters<engineDataTransfer.TransferEngine['diagnostics']['onDiagnostic']>[0];
type Loaders = {
    [key in engineDataTransfer.TransferStage]: ora.Ora;
};
type Data = {
    [key in engineDataTransfer.TransferStage]?: {
        startTime?: number;
        endTime?: number;
        bytes?: number;
        count?: number;
    };
};
declare const loadersFactory: (defaultLoaders?: Loaders) => {
    updateLoader: (stage: engineDataTransfer.TransferStage, data: Data) => ora.Ora;
    createLoader: (stage: engineDataTransfer.TransferStage) => ora.Ora;
    getLoader: (stage: engineDataTransfer.TransferStage) => ora.Ora;
};
/**
 * Get the telemetry data to be sent for a didDEITSProcess* event from an initialized transfer engine object
 */
declare const getTransferTelemetryPayload: (engine: engineDataTransfer.TransferEngine) => {
    eventProperties: {
        source: string;
        destination: string;
    };
};
/**
 * Get a transfer engine schema diff handler that confirms with the user before bypassing a schema check
 */
declare const getDiffHandler: (engine: engineDataTransfer.TransferEngine, { force, action, }: {
    force?: boolean;
    action: string;
}) => (context: engineDataTransfer.SchemaDiffHandlerContext, next: (ctx: engineDataTransfer.SchemaDiffHandlerContext) => void) => Promise<void>;
declare const getAssetsBackupHandler: (engine: engineDataTransfer.TransferEngine, { force, action, }: {
    force?: boolean;
    action: string;
}) => (context: engineDataTransfer.ErrorHandlerContext, next: (ctx: engineDataTransfer.ErrorHandlerContext) => void) => Promise<void>;
declare const shouldSkipStage: (opts: Partial<engineDataTransfer.ITransferEngineOptions>, dataKind: engineDataTransfer.TransferFilterPreset) => boolean;
declare const parseRestoreFromOptions: (opts: Partial<engineDataTransfer.ITransferEngineOptions>) => import("@strapi/data-transfer/dist/strapi/providers/local-destination/strategies/restore").IRestoreOptions;
export { loadersFactory, buildTransferTable, getDefaultExportName, getTransferTelemetryPayload, DEFAULT_IGNORED_CONTENT_TYPES, createStrapiInstance, excludeOption, exitMessageText, onlyOption, throttleOption, validateExcludeOnly, formatDiagnostic, abortTransfer, setSignalHandler, getDiffHandler, getAssetsBackupHandler, shouldSkipStage, parseRestoreFromOptions, };
//# sourceMappingURL=data-transfer.d.ts.map