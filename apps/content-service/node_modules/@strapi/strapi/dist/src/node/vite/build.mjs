import { resolveProductionConfig, mergeConfigWithUserConfig } from './config.mjs';

const build = async (ctx)=>{
    const config = await resolveProductionConfig(ctx);
    const finalConfig = await mergeConfigWithUserConfig(config, ctx);
    const { build: viteBuild } = await import('vite');
    ctx.logger.debug('Vite config', finalConfig);
    await viteBuild(finalConfig);
};

export { build };
//# sourceMappingURL=build.mjs.map
