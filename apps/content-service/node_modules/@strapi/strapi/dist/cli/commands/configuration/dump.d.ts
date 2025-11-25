import type { StrapiCommand } from '../../types';
interface CmdOptions {
    file?: string;
    pretty?: boolean;
}
/**
 * Will dump configurations to a file or stdout
 * @param {string} file filepath to use as output
 */
declare const action: ({ file: filePath, pretty }: CmdOptions) => Promise<never>;
/**
 * `$ strapi configuration:dump`
 */
declare const command: StrapiCommand;
export { action, command };
//# sourceMappingURL=dump.d.ts.map