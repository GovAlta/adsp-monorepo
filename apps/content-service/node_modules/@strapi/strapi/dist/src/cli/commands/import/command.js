'use strict';

var path = require('path');
var commander = require('commander');
var inquirer = require('inquirer');
var dataTransfer = require('../../utils/data-transfer.js');
var commander$1 = require('../../utils/commander.js');
var helpers = require('../../utils/helpers.js');
var action = require('./action.js');

/**
 * `$ strapi import`
 */ const command = ()=>{
    return commander.createCommand('import').description('Import data from file to Strapi').allowExcessArguments(false).requiredOption('-f, --file <file>', 'path and filename for the Strapi export file you want to import').addOption(new commander.Option('-k, --key <string>', 'Provide encryption key in command instead of using the prompt')).addOption(new commander.Option('--verbose', 'Enable verbose logs')).addOption(commander$1.forceOption).addOption(dataTransfer.excludeOption).addOption(dataTransfer.onlyOption).addOption(dataTransfer.throttleOption).hook('preAction', dataTransfer.validateExcludeOnly).hook('preAction', async (thisCommand)=>{
        const opts = thisCommand.opts();
        const ext = path.extname(String(opts.file));
        // check extension to guess if we should prompt for key
        if (ext === '.enc') {
            if (!opts.key) {
                const answers = await inquirer.prompt([
                    {
                        type: 'password',
                        message: 'Please enter your decryption key',
                        name: 'key'
                    }
                ]);
                if (!answers.key?.length) {
                    helpers.exitWith(1, 'No key entered, aborting import.');
                }
                opts.key = answers.key;
            }
        }
    })// set decrypt and decompress options based on filename
    .hook('preAction', (thisCommand)=>{
        const opts = thisCommand.opts();
        const { extname, parse } = path;
        let file = opts.file;
        if (extname(file) === '.enc') {
            file = parse(file).name; // trim the .enc extension
            thisCommand.opts().decrypt = true;
        } else {
            thisCommand.opts().decrypt = false;
        }
        if (extname(file) === '.gz') {
            file = parse(file).name; // trim the .gz extension
            thisCommand.opts().decompress = true;
        } else {
            thisCommand.opts().decompress = false;
        }
        if (extname(file) !== '.tar') {
            helpers.exitWith(1, `The file '${opts.file}' does not appear to be a valid Strapi data file. It must have an extension ending in .tar[.gz][.enc]`);
        }
    }).hook('preAction', commander$1.getCommanderConfirmMessage('The import will delete your existing data! Are you sure you want to proceed?', {
        failMessage: 'Import process aborted'
    })).action(action);
};

module.exports = command;
//# sourceMappingURL=command.js.map
