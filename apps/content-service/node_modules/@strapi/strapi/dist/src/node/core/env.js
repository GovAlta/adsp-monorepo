'use strict';

var path = require('node:path');
var dotenv = require('dotenv');
var files = require('./files.js');

/**
 * @internal
 *
 * @description Load the .env file if it exists
 */ const loadEnv = async (cwd)=>{
    const pathToEnv = path.resolve(cwd, '.env');
    if (await files.pathExists(pathToEnv)) {
        dotenv.config({
            path: pathToEnv
        });
    }
};
/**
 * @internal
 *
 * @description Get all the environment variables that start with `STRAPI_ADMIN_`
 */ const getStrapiAdminEnvVars = (defaultEnv)=>{
    return Object.keys(process.env).filter((key)=>key.toUpperCase().startsWith('STRAPI_ADMIN_')).reduce((acc, key)=>{
        acc[key] = process.env[key];
        return acc;
    }, defaultEnv);
};

exports.getStrapiAdminEnvVars = getStrapiAdminEnvVars;
exports.loadEnv = loadEnv;
//# sourceMappingURL=env.js.map
