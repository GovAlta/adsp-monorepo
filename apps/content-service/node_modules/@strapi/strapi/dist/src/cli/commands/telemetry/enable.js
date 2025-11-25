'use strict';

var path = require('path');
var crypto = require('crypto');
var fse = require('fs-extra');
var chalk = require('chalk');
var commander = require('commander');
var helpers = require('../../utils/helpers.js');
var telemetry = require('../../utils/telemetry.js');

const readPackageJSON = async (path)=>{
    try {
        const packageObj = await fse.readJson(path);
        return packageObj;
    } catch (err) {
        if (err instanceof Error) {
            console.error(`${chalk.red('Error')}: ${err.message}`);
        } else {
            throw err;
        }
    }
};
const writePackageJSON = async (path, file, spacing)=>{
    try {
        await fse.writeJson(path, file, {
            spaces: spacing
        });
        return true;
    } catch (err) {
        if (err instanceof Error) {
            console.error(`${chalk.red('Error')}: ${err.message}`);
            console.log(`${chalk.yellow('Warning')}: There has been an error, please set "telemetryDisabled": false in the "strapi" object of your package.json manually.`);
            return false;
        }
        throw err;
    }
};
const generateNewPackageJSON = (packageObj)=>{
    if (!packageObj.strapi) {
        return {
            ...packageObj,
            strapi: {
                uuid: crypto.randomUUID(),
                telemetryDisabled: false
            }
        };
    }
    return {
        ...packageObj,
        strapi: {
            ...packageObj.strapi,
            uuid: packageObj.strapi.uuid ? packageObj.strapi.uuid : crypto.randomUUID(),
            telemetryDisabled: false
        }
    };
};
const action = async ()=>{
    const packageJSONPath = path.resolve(process.cwd(), 'package.json');
    const exists = await fse.pathExists(packageJSONPath);
    if (!exists) {
        console.log(`${chalk.yellow('Warning')}: could not find package.json`);
        process.exit(0);
    }
    const packageObj = await readPackageJSON(packageJSONPath);
    if (packageObj.strapi && packageObj.strapi.uuid) {
        if (packageObj.strapi.telemetryDisabled === false) {
            console.log(`${chalk.yellow('Warning:')} telemetry is already enabled`);
            process.exit(0);
        }
    }
    const updatedPackageJSON = generateNewPackageJSON(packageObj);
    const write = await writePackageJSON(packageJSONPath, updatedPackageJSON, 2);
    if (!write) {
        process.exit(0);
    }
    await telemetry.sendEvent('didOptInTelemetry', updatedPackageJSON.strapi.uuid, updatedPackageJSON.strapi?.installId);
    console.log(`${chalk.green('Successfully opted into and enabled Strapi telemetry')}`);
    process.exit(0);
};
/**
 * `$ strapi telemetry:enable`
 */ const command = ()=>{
    return commander.createCommand('telemetry:enable').description('Enable anonymous telemetry and metadata sending to Strapi analytics').action(helpers.runAction('telemetry:enable', action));
};

exports.action = action;
exports.command = command;
//# sourceMappingURL=enable.js.map
