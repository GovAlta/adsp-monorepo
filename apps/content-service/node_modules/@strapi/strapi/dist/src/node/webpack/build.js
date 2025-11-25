'use strict';

var webpack = require('webpack');
var config = require('./config.js');
var errors = require('../core/errors.js');

const build = async (ctx)=>{
    const config$1 = await config.resolveProductionConfig(ctx);
    const finalConfig = await config.mergeConfigWithUserConfig(config$1, ctx);
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
            if (err && errors.isError(err)) {
                ctx.logger.error(err.message);
                reject();
            }
        });
    });
};

exports.build = build;
//# sourceMappingURL=build.js.map
