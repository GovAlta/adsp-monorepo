'use strict';

var commander = require('commander');
var fs = require('fs');
var tsUtils = require('@strapi/typescript-utils');
var core = require('@strapi/core');
var helpers = require('../utils/helpers.js');

const action = async ()=>{
    const appDir = process.cwd();
    const isTSProject = await tsUtils.isUsingTypeScript(appDir);
    const outDir = await tsUtils.resolveOutDir(appDir);
    const distDir = isTSProject ? outDir : appDir;
    const buildDirExists = fs.existsSync(outDir);
    if (isTSProject && !buildDirExists) throw new Error(`${outDir} directory not found. Please run the build command before starting your application`);
    core.createStrapi({
        appDir,
        distDir
    }).start();
};
/**
 * `$ strapi start`
 */ const command = ()=>{
    return commander.createCommand('start').description('Start your Strapi application').action(helpers.runAction('start', action));
};

exports.command = command;
//# sourceMappingURL=start.js.map
