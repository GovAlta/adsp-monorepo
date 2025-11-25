import { engine as engineDataTransfer } from '@strapi/data-transfer';
interface CmdOptions {
    file?: string;
    encrypt?: boolean;
    verbose?: boolean;
    key?: string;
    compress?: boolean;
    only?: (keyof engineDataTransfer.TransferGroupFilter)[];
    exclude?: (keyof engineDataTransfer.TransferGroupFilter)[];
    throttle?: number;
    maxSizeJsonl?: number;
}
/**
 * Export command.
 *
 * It transfers data from a local Strapi instance to a file
 *
 * @param {ExportCommandOptions} opts
 */
declare const _default: (opts: CmdOptions) => Promise<void>;
export default _default;
//# sourceMappingURL=action.d.ts.map