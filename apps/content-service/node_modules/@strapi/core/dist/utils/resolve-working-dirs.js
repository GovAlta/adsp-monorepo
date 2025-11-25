'use strict';

var path = require('node:path');

/**
 * Resolve the working directories based on the instance options.
 *
 * Behavior:
 * - `appDir` is the directory where Strapi will write every file (schemas, generated APIs, controllers or services)
 * - `distDir` is the directory where Strapi will read configurations, schemas and any compiled code
 *
 * Default values:
 * - If `appDir` is `undefined`, it'll be set to `process.cwd()`
 * - If `distDir` is `undefined`, it'll be set to `appDir`
 */ const resolveWorkingDirectories = (opts)=>{
    const cwd = process.cwd();
    const appDir = opts.appDir ? path.resolve(cwd, opts.appDir) : cwd;
    const distDir = opts.distDir ? path.resolve(cwd, opts.distDir) : appDir;
    return {
        appDir,
        distDir
    };
};

exports.resolveWorkingDirectories = resolveWorkingDirectories;
//# sourceMappingURL=resolve-working-dirs.js.map
