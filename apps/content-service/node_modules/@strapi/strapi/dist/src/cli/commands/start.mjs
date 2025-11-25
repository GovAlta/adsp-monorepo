import { createCommand } from 'commander';
import fs from 'fs';
import tsUtils__default from '@strapi/typescript-utils';
import { createStrapi } from '@strapi/core';
import { runAction } from '../utils/helpers.mjs';

const action = async ()=>{
    const appDir = process.cwd();
    const isTSProject = await tsUtils__default.isUsingTypeScript(appDir);
    const outDir = await tsUtils__default.resolveOutDir(appDir);
    const distDir = isTSProject ? outDir : appDir;
    const buildDirExists = fs.existsSync(outDir);
    if (isTSProject && !buildDirExists) throw new Error(`${outDir} directory not found. Please run the build command before starting your application`);
    createStrapi({
        appDir,
        distDir
    }).start();
};
/**
 * `$ strapi start`
 */ const command = ()=>{
    return createCommand('start').description('Start your Strapi application').action(runAction('start', action));
};

export { command };
//# sourceMappingURL=start.mjs.map
