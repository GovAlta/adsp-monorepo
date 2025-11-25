'use strict';

var pkg = require('../../utils/pkg.js');

async function getProjectNameFromPackageJson(ctx) {
    try {
        const packageJson = await pkg.loadPkg(ctx);
        return packageJson.name || 'my-strapi-project';
    } catch (e) {
        return 'my-strapi-project';
    }
}

exports.getProjectNameFromPackageJson = getProjectNameFromPackageJson;
//# sourceMappingURL=get-project-name-from-pkg.js.map
