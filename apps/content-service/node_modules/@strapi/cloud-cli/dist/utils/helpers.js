'use strict';

var chalk = require('chalk');
var fp = require('lodash/fp');

// TODO: Remove duplicated code by extracting to a shared package
const assertCwdContainsStrapiProject = (name)=>{
    const logErrorAndExit = ()=>{
        console.log(`You need to run ${chalk.yellow(`strapi ${name}`)} in a Strapi project. Make sure you are in the right directory.`);
        process.exit(1);
    };
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
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

exports.runAction = runAction;
//# sourceMappingURL=helpers.js.map
