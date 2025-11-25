import { engine as engineDataTransfer } from '@strapi/data-transfer';
interface CmdOptions {
    from?: URL;
    fromToken: string;
    to: URL;
    toToken: string;
    verbose?: boolean;
    only?: (keyof engineDataTransfer.TransferGroupFilter)[];
    exclude?: (keyof engineDataTransfer.TransferGroupFilter)[];
    throttle?: number;
    force?: boolean;
}
/**
 * Transfer command.
 *
 * Transfers data between local Strapi and remote Strapi instances
 */
declare const _default: (opts: CmdOptions) => Promise<void>;
export default _default;
//# sourceMappingURL=action.d.ts.map