'use strict';

var execa = require('execa');
var preferredPM = require('preferred-pm');

const SUPPORTED_PACKAGE_MANAGERS = [
    'npm',
    'yarn'
];
const DEFAULT_PACKAGE_MANAGER = 'npm';
const getPreferred = async (pkgPath)=>{
    const pm = await preferredPM(pkgPath);
    const hasPackageManager = pm !== undefined;
    if (!hasPackageManager) {
        throw new Error(`Couldn't find a package manager in your project.`);
    }
    const isPackageManagerSupported = SUPPORTED_PACKAGE_MANAGERS.includes(pm.name);
    if (!isPackageManagerSupported) {
        process.emitWarning(`We detected your package manager (${pm.name} v${pm.version}), but it's not officially supported by Strapi yet. Defaulting to npm instead.`);
        return DEFAULT_PACKAGE_MANAGER;
    }
    return pm.name;
};
const installDependencies = (path, packageManager, options = {})=>{
    return execa(packageManager, [
        'install'
    ], {
        ...options,
        cwd: path,
        stdin: 'ignore'
    });
};

exports.getPreferred = getPreferred;
exports.installDependencies = installDependencies;
//# sourceMappingURL=package-manager.js.map
