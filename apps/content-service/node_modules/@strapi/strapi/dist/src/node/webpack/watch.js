'use strict';

var os = require('node:os');
var path = require('node:path');
var node_util = require('node:util');
var webpackDevMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require('webpack-hot-middleware');
var webpack = require('webpack');
var config = require('./config.js');

const watch = async (ctx)=>{
    const config$1 = await config.resolveDevelopmentConfig(ctx);
    const finalConfig = await config.mergeConfigWithUserConfig(config$1, ctx);
    ctx.logger.debug('Final webpack config:', os.EOL, finalConfig);
    return new Promise((res)=>{
        const compiler = webpack.webpack(finalConfig);
        const devMiddleware = webpackDevMiddleware(compiler);
        const hotMiddleware = webpackHotMiddleware(compiler, {
            log: false,
            path: '/__webpack_hmr'
        });
        ctx.strapi.server.app.use((ctx, next)=>{
            return new Promise((resolve, reject)=>{
                hotMiddleware(ctx.req, ctx.res, (err)=>{
                    if (err) reject(err);
                    else resolve(next());
                });
            });
        });
        ctx.strapi.server.app.use((context, next)=>{
            // wait for webpack-dev-middleware to signal that the build is ready
            const ready = new Promise((resolve)=>{
                devMiddleware.waitUntilValid(()=>{
                    resolve(true);
                });
            });
            // tell webpack-dev-middleware to handle the request
            const init = new Promise((resolve)=>{
                devMiddleware(context.req, {
                    // @ts-expect-error ignored
                    end (content) {
                        // eslint-disable-next-line no-param-reassign
                        context.body = content;
                        resolve(true);
                    },
                    getHeader: context.get.bind(context),
                    // @ts-expect-error ignored
                    setHeader: context.set.bind(context),
                    locals: context.state
                }, ()=>resolve(next()));
            });
            return Promise.all([
                ready,
                init
            ]);
        });
        const serveAdmin = async (ctx, next)=>{
            await next();
            if (devMiddleware.context.outputFileSystem.createReadStream) {
                if (ctx.method !== 'HEAD' && ctx.method !== 'GET') {
                    return;
                }
                if (ctx.body != null || ctx.status !== 404) {
                    return;
                }
                // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
                const filename = path.resolve(finalConfig.output?.path, 'index.html');
                ctx.type = 'html';
                ctx.body = devMiddleware.context.outputFileSystem.createReadStream(filename);
            }
        };
        ctx.strapi.server.routes([
            {
                method: 'GET',
                path: `${ctx.adminPath}/:path*`,
                handler: serveAdmin,
                config: {
                    auth: false
                }
            }
        ]);
        devMiddleware.waitUntilValid(()=>{
            res({
                async close () {
                    await Promise.all([
                        node_util.promisify(devMiddleware.close.bind(devMiddleware))(),
                        hotMiddleware.close(),
                        node_util.promisify(compiler.close.bind(compiler))()
                    ]);
                }
            });
        });
    });
};

exports.watch = watch;
//# sourceMappingURL=watch.js.map
