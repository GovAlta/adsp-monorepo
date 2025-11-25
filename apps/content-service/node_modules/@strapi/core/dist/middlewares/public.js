'use strict';

var fp = require('lodash/fp');
var koaStatic = require('koa-static');

const defaults = {
    maxAge: 60000
};
const publicStatic = (config, { strapi })=>{
    const { maxAge } = fp.defaultsDeep(defaults, config);
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

exports.publicStatic = publicStatic;
//# sourceMappingURL=public.js.map
