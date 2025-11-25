import path from 'node:path';
import dotenv from 'dotenv';
import { pathExists } from './files.mjs';

/**
 * @internal
 *
 * @description Load the .env file if it exists
 */ const loadEnv = async (cwd)=>{
    const pathToEnv = path.resolve(cwd, '.env');
    if (await pathExists(pathToEnv)) {
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

export { getStrapiAdminEnvVars, loadEnv };
//# sourceMappingURL=env.mjs.map
