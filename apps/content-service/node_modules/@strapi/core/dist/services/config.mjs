import { get, set, has, isString, isArray, isNumber } from 'lodash';

const createConfigProvider = (initialConfig = {}, strapi)=>{
    const state = {
        config: {
            ...initialConfig
        }
    };
    // Accessing model configs with dot (.) was deprecated between v4->v5, but to avoid a major breaking change
    // we will still support certain namespaces, currently only 'plugin.'
    const transformPathString = (path)=>{
        if (path.startsWith('plugin.')) {
            const newPath = path.replace('plugin.', 'plugin::');
            // strapi logger may not be loaded yet, so fall back to console
            (strapi?.log?.warn ?? console.warn)(`Using dot notation for model config namespaces is deprecated, for example "plugin::myplugin" should be used instead of "plugin.myplugin". Modifying requested path ${path} to ${newPath}`);
            return newPath;
        }
        return path;
    };
    const transformDeprecatedPaths = (path)=>{
        if (isString(path)) {
            return transformPathString(path);
        }
        if (isArray(path)) {
            // if the path is not joinable, we won't apply our deprecation support
            if (path.some((part)=>!(isString(part) || isNumber(part)))) {
                return path;
            }
            return transformPathString(path.join('.'));
        }
        return path;
    };
    return {
        ...state.config,
        get (path, defaultValue) {
            return get(state.config, transformDeprecatedPaths(path), defaultValue);
        },
        set (path, val) {
            set(state.config, transformDeprecatedPaths(path), val);
            return this;
        },
        has (path) {
            return has(state.config, transformDeprecatedPaths(path));
        }
    };
};

export { createConfigProvider };
//# sourceMappingURL=config.mjs.map
