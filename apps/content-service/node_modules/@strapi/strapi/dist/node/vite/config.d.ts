import type { InlineConfig, UserConfig } from 'vite';
import type { BuildContext } from '../create-build-context';
declare const resolveProductionConfig: (ctx: BuildContext) => Promise<InlineConfig>;
declare const resolveDevelopmentConfig: (ctx: BuildContext) => Promise<InlineConfig>;
declare const mergeConfigWithUserConfig: (config: InlineConfig, ctx: BuildContext) => Promise<UserConfig>;
export { mergeConfigWithUserConfig, resolveProductionConfig, resolveDevelopmentConfig };
//# sourceMappingURL=config.d.ts.map