import type { StrapiCommand } from '../../types';
type Strategy = 'replace' | 'merge' | 'keep';
interface CmdOptions {
    file?: string;
    strategy?: Strategy;
}
/**
 * Will restore configurations. It reads from a file or stdin
 */
declare const action: ({ file: filePath, strategy }: CmdOptions) => Promise<never>;
/**
 * `$ strapi configuration:restore`
 */
declare const command: StrapiCommand;
export { action, command };
//# sourceMappingURL=restore.d.ts.map