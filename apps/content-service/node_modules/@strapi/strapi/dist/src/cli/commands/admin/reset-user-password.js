'use strict';

var _ = require('lodash');
var inquirer = require('inquirer');
var commander = require('commander');
var core = require('@strapi/core');
var helpers = require('../../utils/helpers.js');

const promptQuestions = [
    {
        type: 'input',
        name: 'email',
        message: 'User email?'
    },
    {
        type: 'password',
        name: 'password',
        message: 'New password?'
    },
    {
        type: 'confirm',
        name: 'confirm',
        message: "Do you really want to reset this user's password?"
    }
];
async function changePassword({ email, password }) {
    const appContext = await core.compileStrapi();
    const app = await core.createStrapi(appContext).load();
    await app.admin.services.user.resetPasswordByEmail(email, password);
    console.log(`Successfully reset user's password`);
    process.exit(0);
}
/**
 * Reset user's password
 */ const action = async (cmdOptions = {})=>{
    const { email, password } = cmdOptions;
    if (_.isEmpty(email) && _.isEmpty(password) && process.stdin.isTTY) {
        const inquiry = await inquirer.prompt(promptQuestions);
        if (!inquiry.confirm) {
            process.exit(0);
        }
        return changePassword(inquiry);
    }
    if (_.isEmpty(email) || _.isEmpty(password)) {
        console.error('Missing required options `email` or `password`');
        process.exit(1);
    }
    return changePassword({
        email,
        password
    });
};
/**
 * `$ strapi admin:reset-user-password`
 */ const command = ()=>{
    return commander.createCommand('admin:reset-user-password').alias('admin:reset-password').description("Reset an admin user's password").option('-e, --email <email>', 'The user email').option('-p, --password <password>', 'New password for the user').action(helpers.runAction('admin:reset-user-password', action));
};

exports.action = action;
exports.command = command;
//# sourceMappingURL=reset-user-password.js.map
