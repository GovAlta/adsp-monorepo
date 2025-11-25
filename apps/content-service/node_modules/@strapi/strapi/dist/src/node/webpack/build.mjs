import webpack from 'webpack';
import { resolveProductionConfig, mergeConfigWithUserConfig } from './config.mjs';
import { isError } from '../core/errors.mjs';

const build = async (ctx)=>{
    const config = await resolveProductionConfig(ctx);
    const finalConfig = await mergeConfigWithUserConfig(config, ctx);
    ctx.logger.debug('Webpack config', finalConfig);
    return new Promise((resolve, reject)=>{
        webpack(finalConfig, (err, stats)=>{
            if (stats) {
                if (stats.hasErrors()) {
                    ctx.logger.error(stats.toString({
                        chunks: false,
                        colors: true
                    }));
                    reject();
                } else if (ctx.options.stats) {
                    ctx.logger.info(stats.toString({
                        chunks: false,
                        colors: true
                    }));
                }
                resolve(true);
            }
            if (err && isError(err)) {
                ctx.logger.error(err.message);
                reject();
            }
        });
    });
};

export { build };
//# sourceMappingURL=build.mjs.map
