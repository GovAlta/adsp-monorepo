/// <reference types="node" />
import type { Core, Modules } from '@strapi/types';
import type { Server } from 'node:http';
import type { CLIContext } from '../cli/types';
import { PluginMeta } from './core/plugins';
import { AppFile } from './core/admin-customisations';
import type { BaseContext } from './types';
interface BaseOptions {
    stats?: boolean;
    minify?: boolean;
    sourcemaps?: boolean;
    bundler?: 'webpack' | 'vite';
    open?: boolean;
    hmrServer?: Server;
    hmrClientPort?: number;
}
interface BuildContext<TOptions = unknown> extends BaseContext {
    /**
     * The customisations defined by the user in their app.js file
     */
    customisations?: AppFile;
    /**
     * Features object with future flags
     */
    features?: Modules.Features.FeaturesService['config'];
    /**
     * The build options
     */
    options: BaseOptions & TOptions;
    /**
     * The plugins to be included in the JS bundle
     * incl. internal plugins, third party plugins & local plugins
     */
    plugins: PluginMeta[];
}
interface CreateBuildContextArgs<TOptions = unknown> extends CLIContext {
    strapi?: Core.Strapi;
    options?: TOptions;
}
declare const createBuildContext: <TOptions extends BaseOptions>({ cwd, logger, tsconfig, strapi, options, }: CreateBuildContextArgs<TOptions>) => Promise<BuildContext<TOptions>>;
export { createBuildContext };
export type { BuildContext, CreateBuildContextArgs };
//# sourceMappingURL=create-build-context.d.ts.map