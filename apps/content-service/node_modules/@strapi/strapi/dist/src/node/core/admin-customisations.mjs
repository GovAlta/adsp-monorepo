import path from 'node:path';
import { pathExists, convertSystemPathToModulePath } from './files.mjs';

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
        if (await pathExists(filePath)) {
            return {
                path: filePath,
                modulePath: convertSystemPathToModulePath(path.relative(runtimeDir, filePath))
            };
        }
    }
    return undefined;
};

export { loadUserAppFile };
//# sourceMappingURL=admin-customisations.mjs.map
