import { defaultsDeep } from 'lodash/fp';
import koaStatic from 'koa-static';

const defaults = {
    maxAge: 60000
};
const publicStatic = (config, { strapi })=>{
    const { maxAge } = defaultsDeep(defaults, config);
    strapi.server.routes([
        {
            method: 'GET',
            path: '/',
            handler (ctx) {
                ctx.redirect(strapi.config.get('admin.url', '/admin'));
            },
            config: {
                auth: false
            }
        },
        // All other public GET-routes except /uploads/(.*) which is handled in upload middleware
        {
            method: 'GET',
            path: '/((?!uploads/).+)',
            handler: koaStatic(strapi.dirs.static.public, {
                maxage: maxAge,
                defer: true
            }),
            config: {
                auth: false
            }
        }
    ]);
};

export { publicStatic };
//# sourceMappingURL=public.mjs.map
