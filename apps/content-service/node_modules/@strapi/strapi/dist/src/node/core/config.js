'use strict';

var path = require('node:path');
var files = require('./files.js');

const getUserConfig = async (fileNames, ctx)=>{
    for (const file of fileNames){
        const filePath = path.join(ctx.appDir, 'src', 'admin', file);
        const configFile = await files.loadFile(filePath);
        if (configFile) {
            return configFile;
        }
    }
    return undefined;
};

exports.getUserConfig = getUserConfig;
//# sourceMappingURL=config.js.map
