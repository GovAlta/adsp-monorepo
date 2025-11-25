'use strict';

var fs = require('fs');
var path = require('path');
var koaFavicon = require('koa-favicon');

const defaults = {
    path: 'favicon.png',
    maxAge: 86400000
};
const favicon = (config, { strapi })=>{
    const { maxAge, path: faviconDefaultPath } = {
        ...defaults,
        ...config
    };
    const { root: appRoot } = strapi.dirs.app;
    let faviconPath = faviconDefaultPath;
    /** TODO (v5): Updating the favicon to use a png caused
   *  https://github.com/strapi/strapi/issues/14693
   *
   *  This check ensures backwards compatibility until
   *  the next major version
   */ if (!fs.existsSync(path.resolve(appRoot, faviconPath))) {
        faviconPath = 'favicon.ico';
    }
    return koaFavicon(path.resolve(appRoot, faviconPath), {
        maxAge
    });
};

exports.favicon = favicon;
//# sourceMappingURL=favicon.js.map
