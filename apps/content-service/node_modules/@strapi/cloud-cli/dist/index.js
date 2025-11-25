'use strict';

var crypto = require('crypto');
var index$1 = require('./deploy-project/index.js');
var index$2 = require('./link/index.js');
var index$3 = require('./login/index.js');
var index$4 = require('./logout/index.js');
var index$5 = require('./create-project/index.js');
var action = require('./create-growth-sso-trial/action.js');
var index$7 = require('./list-projects/index.js');
var index$8 = require('./environment/list/index.js');
var index$6 = require('./environment/link/index.js');
var local = require('./config/local.js');
var index = require('./services/index.js');

const cli = {
    deployProject: index$1.default,
    link: index$2.default,
    login: index$3.default,
    logout: index$4.default,
    createProject: index$5.default,
    linkEnvironment: index$6.default,
    listProjects: index$7.default,
    listEnvironments: index$8.default
};
const cloudCommands = [
    index$1.default,
    index$2.default,
    index$3.default,
    index$4.default,
    index$6.default,
    index$7.default,
    index$8.default
];
async function initCloudCLIConfig() {
    const localConfig = await local.getLocalConfig();
    if (!localConfig.installId) {
        localConfig.installId = crypto.randomUUID();
    }
    await local.saveLocalConfig(localConfig);
}
async function buildStrapiCloudCommands({ command, ctx, argv }) {
    await initCloudCLIConfig();
    // Load all commands
    for (const cloudCommand of cloudCommands){
        try {
            // Add this command to the Commander command object
            const subCommand = await cloudCommand.command({
                command,
                ctx,
                argv
            });
            if (subCommand) {
                command.addCommand(subCommand);
            }
        } catch (e) {
            console.error(`Failed to load command ${cloudCommand.name}`, e);
        }
    }
}

exports.createGrowthSsoTrial = action;
exports.services = index;
exports.buildStrapiCloudCommands = buildStrapiCloudCommands;
exports.cli = cli;
//# sourceMappingURL=index.js.map
