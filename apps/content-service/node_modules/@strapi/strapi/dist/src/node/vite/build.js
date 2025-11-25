'use strict';

var config = require('./config.js');

const build = async (ctx)=>{
    const config$1 = await config.resolveProductionConfig(ctx);
    const finalConfig = await config.mergeConfigWithUserConfig(config$1, ctx);
    const { build: viteBuild } = await import('vite');
    ctx.logger.debug('Vite config', finalConfig);
    await viteBuild(finalConfig);
};

exports.build = build;
//# sourceMappingURL=build.js.map
