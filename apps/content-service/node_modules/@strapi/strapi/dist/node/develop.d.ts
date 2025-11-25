import type { CLIContext } from '../cli/types';
interface DevelopOptions extends CLIContext {
    /**
     * Which bundler to use for building.
     *
     * @default webpack
     */
    bundler?: 'webpack' | 'vite';
    polling?: boolean;
    open?: boolean;
    watchAdmin?: boolean;
}
declare const develop: ({ cwd, polling, logger, tsconfig, watchAdmin, ...options }: DevelopOptions) => Promise<void>;
export { develop };
export type { DevelopOptions };
//# sourceMappingURL=develop.d.ts.map