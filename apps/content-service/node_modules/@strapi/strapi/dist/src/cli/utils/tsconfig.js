'use strict';

var os = require('os');
var ts = require('typescript');

/**
 * @description Load a tsconfig.json file and return the parsed config.
 *
 * @internal
 */ const loadTsConfig = ({ cwd, path, logger })=>{
    const configPath = ts.findConfigFile(cwd, ts.sys.fileExists, path);
    if (!configPath) {
        return undefined;
    }
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, cwd);
    logger.debug(`Loaded user TS config:`, os.EOL, parsedConfig);
    return {
        config: parsedConfig,
        path: configPath
    };
};

exports.loadTsConfig = loadTsConfig;
//# sourceMappingURL=tsconfig.js.map
