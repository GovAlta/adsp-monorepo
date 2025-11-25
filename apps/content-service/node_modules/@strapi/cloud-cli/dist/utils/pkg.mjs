import * as fse from 'fs-extra';
import os from 'os';
import pkgUp from 'pkg-up';
import * as yup from 'yup';
import 'chalk';

yup.object({
    name: yup.string().required(),
    exports: yup.lazy((value)=>yup.object(typeof value === 'object' ? Object.entries(value).reduce((acc, [key, value])=>{
            if (typeof value === 'object') {
                acc[key] = yup.object({
                    types: yup.string().optional(),
                    source: yup.string().required(),
                    module: yup.string().optional(),
                    import: yup.string().required(),
                    require: yup.string().required(),
                    default: yup.string().required()
                }).noUnknown(true);
            } else {
                acc[key] = yup.string().matches(/^\.\/.*\.json$/).required();
            }
            return acc;
        }, {}) : undefined).optional())
});
/**
 * @description being a task to load the package.json starting from the current working directory
 * using a shallow find for the package.json  and `fs` to read the file. If no package.json is found,
 * the process will throw with an appropriate error message.
 */ const loadPkg = async ({ cwd, logger })=>{
    const pkgPath = await pkgUp({
        cwd
    });
    if (!pkgPath) {
        throw new Error('Could not find a package.json in the current directory');
    }
    const buffer = await fse.readFile(pkgPath);
    const pkg = JSON.parse(buffer.toString());
    logger.debug('Loaded package.json:', os.EOL, pkg);
    return pkg;
};

export { loadPkg };
//# sourceMappingURL=pkg.mjs.map
