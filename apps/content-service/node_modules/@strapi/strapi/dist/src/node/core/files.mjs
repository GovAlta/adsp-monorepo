import path from 'node:path';
import { access } from 'node:fs/promises';
import { register } from 'esbuild-register/dist/node';

/**
 * @internal
 */ const pathExists = async (path)=>{
    try {
        await access(path);
        return true;
    } catch (error) {
        return false;
    }
};
/**
 * @internal
 */ const loadFile = async (path)=>{
    if (await pathExists(path)) {
        const esbuildOptions = {
            extensions: [
                '.js',
                '.mjs',
                '.ts'
            ]
        };
        const { unregister } = register(esbuildOptions);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require(path);
        unregister();
        /**
     * handles esm or cjs exporting.
     */ const file = mod?.default || mod || undefined;
        return file;
    }
    return undefined;
};
/**
 * @internal
 *
 * @description Converts a system path to a module path mainly for `Windows` systems.
 * where the path separator is `\` instead of `/`, on linux systems the path separator
 * is identical to the module path separator.
 */ const convertSystemPathToModulePath = (sysPath)=>{
    if (process.platform === 'win32') {
        return sysPath.split(path.sep).join(path.posix.sep);
    }
    return sysPath;
};
/**
 * @internal
 *
 * @description Converts a module path to a system path, again largely used for Windows systems.
 * The original use case was plugins where the resolve path was in module format but we want to
 * have it relative to the runtime directory.
 */ const convertModulePathToSystemPath = (modulePath)=>{
    if (process.platform === 'win32') {
        return modulePath.split(path.posix.sep).join(path.sep);
    }
    return modulePath;
};

export { convertModulePathToSystemPath, convertSystemPathToModulePath, loadFile, pathExists };
//# sourceMappingURL=files.mjs.map
