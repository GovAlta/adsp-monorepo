'use strict';

var path = require('path');
var fs = require('fs');
var strapiUtils = require('@strapi/utils');

const loadJsFile = (file)=>{
    try {
        const jsModule = strapiUtils.importDefault(file);
        // call if function
        if (typeof jsModule === 'function') {
            return jsModule({
                env: strapiUtils.env
            });
        }
        return jsModule;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Could not load js config file ${file}: ${error.message}`);
        }
        throw new Error('Unknown error');
    }
};
const loadJSONFile = (file)=>{
    try {
        return JSON.parse(fs.readFileSync(file).toString());
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Could not load json config file ${file}: ${error.message}`);
        }
        throw new Error('Unknown error');
    }
};
const loadConfigFile = (file)=>{
    const ext = path.extname(file);
    switch(ext){
        case '.js':
            return loadJsFile(file);
        case '.json':
            return loadJSONFile(file);
        default:
            return {};
    }
};

exports.loadConfigFile = loadConfigFile;
//# sourceMappingURL=load-config-file.js.map
