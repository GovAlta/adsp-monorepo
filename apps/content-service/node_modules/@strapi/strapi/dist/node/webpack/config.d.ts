import { Configuration } from 'webpack';
import type { BuildContext } from '../create-build-context';
declare const resolveDevelopmentConfig: (ctx: BuildContext) => Promise<Configuration>;
declare const resolveProductionConfig: (ctx: BuildContext) => Promise<Configuration>;
declare const mergeConfigWithUserConfig: (config: Configuration, ctx: BuildContext) => Promise<Configuration>;
export { mergeConfigWithUserConfig, resolveDevelopmentConfig, resolveProductionConfig };
//# sourceMappingURL=config.d.ts.map