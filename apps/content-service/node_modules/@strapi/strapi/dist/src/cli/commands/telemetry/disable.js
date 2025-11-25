'use strict';

var path = require('path');
var fse = require('fs-extra');
var chalk = require('chalk');
var commander = require('commander');
var helpers = require('../../utils/helpers.js');
var telemetry = require('../../utils/telemetry.js');

const readPackageJSON = async (path)=>{
    try {
        const packageObj = await fse.readJson(path);
        const uuid = packageObj.strapi ? packageObj.strapi.uuid : null;
        const installId = packageObj.strapi ? packageObj.strapi.installId : null;
        return {
            uuid,
            installId,
            packageObj
        };
    } catch (err) {
        if (err instanceof Error) {
            console.error(`${chalk.red('Error')}: ${err.message}`);
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
        }
    }
};
const action = async ()=>{
    const packageJSONPath = path.resolve(process.cwd(), 'package.json');
    const exists = await fse.pathExists(packageJSONPath);
    if (!exists) {
        console.log(`${chalk.yellow('Warning')}: could not find package.json`);
        process.exit(0);
    }
    const { uuid, installId, packageObj } = await readPackageJSON(packageJSONPath) ?? {};
    if (packageObj.strapi && packageObj.strapi.telemetryDisabled || !uuid) {
        console.log(`${chalk.yellow('Warning:')} telemetry is already disabled`);
        process.exit(0);
    }
    const updatedPackageJSON = {
        ...packageObj,
        strapi: {
            ...packageObj.strapi,
            telemetryDisabled: true
        }
    };
    const write = await writePackageJSON(packageJSONPath, updatedPackageJSON, 2);
    if (!write) {
        console.log(`${chalk.yellow('Warning')}: There has been an error, please set "telemetryDisabled": true in the "strapi" object of your package.json manually.`);
        process.exit(0);
    }
    await telemetry.sendEvent('didOptOutTelemetry', uuid, installId);
    console.log(`${chalk.green('Successfully opted out of Strapi telemetry')}`);
    process.exit(0);
};
/**
 * `$ strapi telemetry:disable`
 */ const command = ()=>{
    return commander.createCommand('telemetry:disable').description('Disable anonymous telemetry and metadata sending to Strapi analytics').action(helpers.runAction('telemetry:disable', action));
};

exports.action = action;
exports.command = command;
//# sourceMappingURL=disable.js.map
