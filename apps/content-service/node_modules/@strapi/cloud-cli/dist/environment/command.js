'use strict';

var command = require('../cloud/command.js');

let environmentCmd = null;
const initializeEnvironmentCommand = (command$1, ctx)=>{
    if (!environmentCmd) {
        const cloud = command.defineCloudNamespace(command$1, ctx);
        environmentCmd = cloud.command('environment').description('Manage environments');
    }
    return environmentCmd;
};

exports.initializeEnvironmentCommand = initializeEnvironmentCommand;
//# sourceMappingURL=command.js.map
