'use strict';

var path = require('path');
var readPkgUp = require('read-pkg-up');

/**
 * Load information about the strapi CMS monorepo (if applicable)
 *
 * @internal
 */ async function loadStrapiMonorepo(cwd) {
    let p = cwd;
    while(p !== '/'){
        const readResult = await readPkgUp({
            cwd: p
        });
        if (!readResult) {
            return undefined;
        }
        if (readResult.packageJson.isStrapiMonorepo) {
            return {
                path: path.dirname(readResult.path)
            };
        }
        p = path.dirname(path.dirname(readResult.path));
    }
    return undefined;
}

exports.loadStrapiMonorepo = loadStrapiMonorepo;
//# sourceMappingURL=monorepo.js.map
