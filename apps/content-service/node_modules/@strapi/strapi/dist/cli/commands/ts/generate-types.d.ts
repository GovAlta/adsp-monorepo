import type { StrapiCommand } from '../../types';
interface CmdOptions {
    debug?: boolean;
    silent?: boolean;
    verbose?: boolean;
    outDir?: string;
}
declare const action: ({ debug, silent, verbose, outDir }: CmdOptions) => Promise<void>;
/**
 * `$ strapi ts:generate-types`
 */
declare const command: StrapiCommand;
export { action, command };
//# sourceMappingURL=generate-types.d.ts.map