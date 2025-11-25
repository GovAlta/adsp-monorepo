/**
 * @internal
 */
declare const pathExists: (path: string) => Promise<boolean>;
/**
 * @internal
 */
declare const loadFile: (path: string) => Promise<undefined | any>;
/**
 * @internal
 *
 * @description Converts a system path to a module path mainly for `Windows` systems.
 * where the path separator is `\` instead of `/`, on linux systems the path separator
 * is identical to the module path separator.
 */
declare const convertSystemPathToModulePath: (sysPath: string) => string;
/**
 * @internal
 *
 * @description Converts a module path to a system path, again largely used for Windows systems.
 * The original use case was plugins where the resolve path was in module format but we want to
 * have it relative to the runtime directory.
 */
declare const convertModulePathToSystemPath: (modulePath: string) => string;
export { pathExists, loadFile, convertSystemPathToModulePath, convertModulePathToSystemPath };
//# sourceMappingURL=files.d.ts.map