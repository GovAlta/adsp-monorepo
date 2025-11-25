'use strict';

var chalk = require('chalk');
var boxen = require('boxen');
var api = require('../config/api.js');

const environmentErrorMessageFactory = ({ projectName, firstLine, secondLine })=>{
    return [
        chalk.yellow(firstLine),
        '',
        chalk.cyan(secondLine),
        chalk.blue(' →  ') + chalk.blue.underline(`${api.apiConfig.dashboardBaseUrl}/projects/${projectName}`)
    ].join('\n');
};
const environmentCreationErrorFactory = (environmentErrorMessage)=>boxen(environmentErrorMessage, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'white',
        titleAlignment: 'left'
    });

exports.environmentCreationErrorFactory = environmentCreationErrorFactory;
exports.environmentErrorMessageFactory = environmentErrorMessageFactory;
//# sourceMappingURL=error-message-factories.js.map
