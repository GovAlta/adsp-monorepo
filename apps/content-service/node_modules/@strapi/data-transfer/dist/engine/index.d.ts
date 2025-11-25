/// <reference types="node" />
import { PassThrough } from 'stream';
import type { IDestinationProvider, ISourceProvider, ITransferEngine, ITransferEngineOptions, TransferProgress, ITransferResults, TransferStage, TransferFilters, TransferFilterPreset, SchemaDiffHandler, SchemaDiffHandlerContext, ErrorHandler, ErrorHandlerContext, ErrorCode } from '../../types';
import { IDiagnosticReporter, ErrorDiagnosticSeverity } from '../utils/diagnostic';
export declare const TRANSFER_STAGES: ReadonlyArray<TransferStage>;
export type TransferGroupFilter = Record<TransferFilterPreset, TransferFilters>;
/**
 * Preset filters for only/exclude options
 * */
export declare const TransferGroupPresets: TransferGroupFilter;
export declare const DEFAULT_VERSION_STRATEGY = "ignore";
export declare const DEFAULT_SCHEMA_STRATEGY = "strict";
declare class TransferEngine<S extends ISourceProvider = ISourceProvider, D extends IDestinationProvider = IDestinationProvider> implements ITransferEngine {
    #private;
    sourceProvider: ISourceProvider;
    destinationProvider: IDestinationProvider;
    options: ITransferEngineOptions;
    progress: {
        data: TransferProgress;
        stream: PassThrough;
    };
    diagnostics: IDiagnosticReporter;
    onSchemaDiff(handler: SchemaDiffHandler): void;
    addErrorHandler(handlerName: ErrorCode, handler: ErrorHandler): void;
    attemptResolveError(error: Error): Promise<boolean>;
    constructor(sourceProvider: S, destinationProvider: D, options: ITransferEngineOptions);
    /**
     * Report a fatal error and throw it
     */
    panic(error: Error): void;
    /**
     * Report an error diagnostic
     */
    reportError(error: Error, severity: ErrorDiagnosticSeverity): void;
    /**
     * Report a warning diagnostic
     */
    reportWarning(message: string, origin?: string): void;
    /**
     * Report an info diagnostic
     */
    reportInfo(message: string, params?: unknown): void;
    shouldSkipStage(stage: TransferStage): boolean;
    abortTransfer(): Promise<void>;
    init(): Promise<void>;
    /**
     * Run the bootstrap method in both source and destination providers
     */
    bootstrap(): Promise<void>;
    /**
     * Run the close method in both source and destination providers
     */
    close(): Promise<void>;
    integrityCheck(): Promise<void>;
    transfer(): Promise<ITransferResults<S, D>>;
    beforeTransfer(): Promise<void>;
    transferSchemas(): Promise<void>;
    transferEntities(): Promise<void>;
    transferLinks(): Promise<void>;
    transferAssets(): Promise<void>;
    transferConfiguration(): Promise<void>;
}
export declare const createTransferEngine: <S extends ISourceProvider, D extends IDestinationProvider>(sourceProvider: S, destinationProvider: D, options: ITransferEngineOptions) => TransferEngine<S, D>;
export type { TransferEngine, ITransferEngine, ITransferEngineOptions, ISourceProvider, IDestinationProvider, TransferStage, TransferFilterPreset, ErrorHandlerContext, SchemaDiffHandlerContext, ITransferResults, };
export * as errors from './errors';
//# sourceMappingURL=index.d.ts.map