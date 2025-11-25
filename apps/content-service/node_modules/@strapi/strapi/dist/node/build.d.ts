import type { CLIContext } from '../cli/types';
interface BuildOptions extends CLIContext {
    /**
     * Which bundler to use for building.
     *
     * @default webpack
     */
    bundler?: 'webpack' | 'vite';
    /**
     * Minify the output
     *
     * @default true
     */
    minify?: boolean;
    /**
     * Generate sourcemaps – useful for debugging bugs in the admin panel UI.
     */
    sourcemaps?: boolean;
    /**
     * Print stats for build
     */
    stats?: boolean;
}
/**
 * @example `$ strapi build`
 *
 * @description Builds the admin panel of the strapi application.
 */
declare const build: ({ logger, cwd, tsconfig, ...options }: BuildOptions) => Promise<void>;
export { build };
export type { BuildOptions };
//# sourceMappingURL=build.d.ts.map