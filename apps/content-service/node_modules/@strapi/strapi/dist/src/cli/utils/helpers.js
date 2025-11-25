'use strict';

var chalk = require('chalk');
var fp = require('lodash/fp');
require('inquirer');
require('boxen');

/**
 * Helper functions for the Strapi CLI
 */ const bytesPerKb = 1024;
const sizes = [
    'B ',
    'KB',
    'MB',
    'GB',
    'TB',
    'PB'
];
/**
 * Convert bytes to a human readable formatted string, for example "1024" becomes "1KB"
 */ const readableBytes = (bytes, decimals = 1, padStart = 0)=>{
    if (!bytes) {
        return '0';
    }
    const i = Math.floor(Math.log(bytes) / Math.log(bytesPerKb));
    const result = `${parseFloat((bytes / bytesPerKb ** i).toFixed(decimals))} ${sizes[i].padStart(2)}`;
    return result.padStart(padStart);
};
/**
 *
 * Display message(s) to console and then call process.exit with code.
 * If code is zero, console.log and green text is used for messages, otherwise console.error and red text.
 *
 */ const exitWith = (code, message, options = {})=>{
    const { logger = console, prc = process } = options;
    const log = (message)=>{
        if (code === 0) {
            logger.log(chalk.green(message));
        } else {
            logger.error(chalk.red(message));
        }
    };
    if (fp.isString(message)) {
        log(message);
    } else if (fp.isArray(message)) {
        message.forEach((msg)=>log(msg));
    }
    prc.exit(code);
};
/**
 * assert that a URL object has a protocol value
 *
 */ const assertUrlHasProtocol = (url, protocol)=>{
    if (!url.protocol) {
        exitWith(1, `${url.toString()} does not have a protocol`);
    }
    // if just checking for the existence of a protocol, return
    if (!protocol) {
        return;
    }
    if (fp.isString(protocol)) {
        if (protocol !== url.protocol) {
            exitWith(1, `${url.toString()} must have the protocol ${protocol}`);
        }
        return;
    }
    // assume an array
    if (!protocol.some((protocol)=>url.protocol === protocol)) {
        return exitWith(1, `${url.toString()} must have one of the following protocols: ${protocol.join(',')}`);
    }
};
/**
 * Passes commander options to conditionCallback(). If it returns true, call isMetCallback otherwise call isNotMetCallback
 */ const ifOptions = (conditionCallback, isMetCallback = async ()=>{}, isNotMetCallback = async ()=>{})=>{
    return async (command)=>{
        const opts = command.opts();
        if (await conditionCallback(opts)) {
            await isMetCallback(command);
        } else {
            await isNotMetCallback(command);
        }
    };
};
const assertCwdContainsStrapiProject = (name)=>{
    const logErrorAndExit = ()=>{
        console.log(`You need to run ${chalk.yellow(`strapi ${name}`)} in a Strapi project. Make sure you are in the right directory.`);
        process.exit(1);
    };
    try {
        const pkgJSON = require(`${process.cwd()}/package.json`);
        if (!fp.has('dependencies.@strapi/strapi', pkgJSON) && !fp.has('devDependencies.@strapi/strapi', pkgJSON)) {
            logErrorAndExit();
        }
    } catch (err) {
        logErrorAndExit();
    }
};
const runAction = (name, action)=>(...args)=>{
        assertCwdContainsStrapiProject(name);
        Promise.resolve().then(()=>{
            return action(...args);
        }).catch((error)=>{
            console.error(error);
            process.exit(1);
        });
    };

exports.assertCwdContainsStrapiProject = assertCwdContainsStrapiProject;
exports.assertUrlHasProtocol = assertUrlHasProtocol;
exports.exitWith = exitWith;
exports.ifOptions = ifOptions;
exports.readableBytes = readableBytes;
exports.runAction = runAction;
//# sourceMappingURL=helpers.js.map
