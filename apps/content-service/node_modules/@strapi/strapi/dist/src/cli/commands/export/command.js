'use strict';

var commander = require('commander');
var dataTransfer = require('../../utils/data-transfer.js');
var commander$1 = require('../../utils/commander.js');
var action = require('./action.js');

/**
 * `$ strapi export`
 */ const command = ()=>{
    return commander.createCommand('export').description('Export data from Strapi to file').allowExcessArguments(false).addOption(new commander.Option('--no-encrypt', `Disables 'aes-128-ecb' encryption of the output file`).default(true)).addOption(new commander.Option('--no-compress', 'Disables gzip compression of output file').default(true)).addOption(new commander.Option('--verbose', 'Enable verbose logs')).addOption(new commander.Option('-k, --key <string>', 'Provide encryption key in command instead of using the prompt')).addOption(new commander.Option('-f, --file <file>', 'name to use for exported file (without extensions)')).addOption(dataTransfer.excludeOption).addOption(dataTransfer.onlyOption).addOption(dataTransfer.throttleOption).hook('preAction', dataTransfer.validateExcludeOnly).hook('preAction', commander$1.promptEncryptionKey).action(action);
};

module.exports = command;
//# sourceMappingURL=command.js.map
