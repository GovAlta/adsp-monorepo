'use strict';

var path = require('node:path');
var files = require('./files.js');

const ADMIN_APP_FILES = [
    'app.js',
    'app.mjs',
    'app.ts',
    'app.jsx',
    'app.tsx'
];
const loadUserAppFile = async ({ runtimeDir, appDir })=>{
    for (const file of ADMIN_APP_FILES){
        const filePath = path.join(appDir, 'src', 'admin', file);
        if (await files.pathExists(filePath)) {
            return {
                path: filePath,
                modulePath: files.convertSystemPathToModulePath(path.relative(runtimeDir, filePath))
            };
        }
    }
    return undefined;
};

exports.loadUserAppFile = loadUserAppFile;
//# sourceMappingURL=admin-customisations.js.map
