import { engine as engineDataTransfer } from '@strapi/data-transfer';
interface CmdOptions {
    file?: string;
    decompress?: boolean;
    decrypt?: boolean;
    verbose?: boolean;
    key?: string;
    conflictStrategy?: 'restore';
    force?: boolean;
    only?: (keyof engineDataTransfer.TransferGroupFilter)[];
    exclude?: (keyof engineDataTransfer.TransferGroupFilter)[];
    throttle?: number;
}
/**
 * Import command.
 *
 * It transfers data from a file to a local Strapi instance
 */
declare const _default: (opts: CmdOptions) => Promise<void>;
export default _default;
//# sourceMappingURL=action.d.ts.map