'use strict';

var inquirer = require('inquirer');
var commander = require('commander');
var chalk = require('chalk');
var fp = require('lodash/fp');
var helpers = require('./helpers.js');

/**
 * argParser: Parse a comma-delimited string as an array
 */ const parseList = (value)=>{
    try {
        return value.split(',').map((item)=>item.trim()); // trim shouldn't be necessary but might help catch unexpected whitespace characters
    } catch (e) {
        helpers.exitWith(1, `Unrecognized input: ${value}`);
    }
    return [];
};
/**
 * Returns an argParser that returns a list
 */ const getParseListWithChoices = (choices, errorMessage = 'Invalid options:')=>{
    return (value)=>{
        const list = parseList(value);
        const invalid = list.filter((item)=>{
            return !choices.includes(item);
        });
        if (invalid.length > 0) {
            helpers.exitWith(1, `${errorMessage}: ${invalid.join(',')}`);
        }
        return list;
    };
};
/**
 * argParser: Parse a string as an integer
 */ const parseInteger = (value)=>{
    // parseInt takes a string and a radix
    const parsedValue = parseInt(value, 10);
    if (fp.isNaN(parsedValue)) {
        throw new commander.InvalidOptionArgumentError(`Not an integer: ${value}`);
    }
    return parsedValue;
};
/**
 * argParser: Parse a string as a URL object
 */ const parseURL = (value)=>{
    try {
        const url = new URL(value);
        if (!url.host) {
            throw new commander.InvalidOptionArgumentError(`Could not parse url ${value}`);
        }
        return url;
    } catch (e) {
        throw new commander.InvalidOptionArgumentError(`Could not parse url ${value}`);
    }
};
/**
 * hook: if encrypt==true and key not provided, prompt for it
 */ const promptEncryptionKey = async (thisCommand)=>{
    const opts = thisCommand.opts();
    if (!opts.encrypt && opts.key) {
        return helpers.exitWith(1, 'Key may not be present unless encryption is used');
    }
    // if encrypt==true but we have no key, prompt for it
    if (opts.encrypt && !(opts.key && opts.key.length > 0)) {
        try {
            const answers = await inquirer.prompt([
                {
                    type: 'password',
                    message: 'Please enter an encryption key',
                    name: 'key',
                    validate (key) {
                        if (key.length > 0) return true;
                        return 'Key must be present when using the encrypt option';
                    }
                }
            ]);
            opts.key = answers.key;
        } catch (e) {
            return helpers.exitWith(1, 'Failed to get encryption key');
        }
        if (!opts.key) {
            return helpers.exitWith(1, 'Failed to get encryption key');
        }
    }
};
/**
 * hook: require a confirmation message to be accepted unless forceOption (-f,--force) is used
 */ const getCommanderConfirmMessage = (message, { failMessage } = {})=>{
    return async (command)=>{
        const confirmed = await confirmMessage(message, {
            force: command.opts().force
        });
        if (!confirmed) {
            helpers.exitWith(1, failMessage);
        }
    };
};
const confirmMessage = async (message, { force } = {})=>{
    // if we have a force option, respond yes
    if (force === true) {
        // attempt to mimic the inquirer prompt exactly
        console.log(`${chalk.green('?')} ${chalk.bold(message)} ${chalk.cyan('Yes')}`);
        return true;
    }
    const answers = await inquirer.prompt([
        {
            type: 'confirm',
            message,
            name: `confirm`,
            default: false
        }
    ]);
    return answers.confirm;
};
const forceOption = new commander.Option('--force', `Automatically answer "yes" to all prompts, including potentially destructive requests, and run non-interactively.`);

exports.confirmMessage = confirmMessage;
exports.forceOption = forceOption;
exports.getCommanderConfirmMessage = getCommanderConfirmMessage;
exports.getParseListWithChoices = getParseListWithChoices;
exports.parseInteger = parseInteger;
exports.parseList = parseList;
exports.parseURL = parseURL;
exports.promptEncryptionKey = promptEncryptionKey;
//# sourceMappingURL=commander.js.map
