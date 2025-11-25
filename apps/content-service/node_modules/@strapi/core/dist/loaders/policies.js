'use strict';

var path = require('path');
var fse = require('fs-extra');
var strapiUtils = require('@strapi/utils');

// TODO:: allow folders with index.js inside for bigger policies
async function loadPolicies(strapi) {
    const dir = strapi.dirs.dist.policies;
    if (!await fse.pathExists(dir)) {
        return;
    }
    const policies = {};
    const paths = await fse.readdir(dir, {
        withFileTypes: true
    });
    for (const fd of paths){
        const { name } = fd;
        const fullPath = path.join(dir, name);
        if (fd.isFile() && path.extname(name) === '.js') {
            const key = path.basename(name, '.js');
            policies[key] = strapiUtils.importDefault(fullPath);
        }
    }
    strapi.get('policies').add(`global::`, policies);
}

module.exports = loadPolicies;
//# sourceMappingURL=policies.js.map
