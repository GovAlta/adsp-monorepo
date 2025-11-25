import chalk from 'chalk';
import boxen from 'boxen';
import { apiConfig } from '../config/api.mjs';

const environmentErrorMessageFactory = ({ projectName, firstLine, secondLine })=>{
    return [
        chalk.yellow(firstLine),
        '',
        chalk.cyan(secondLine),
        chalk.blue(' →  ') + chalk.blue.underline(`${apiConfig.dashboardBaseUrl}/projects/${projectName}`)
    ].join('\n');
};
const environmentCreationErrorFactory = (environmentErrorMessage)=>boxen(environmentErrorMessage, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'white',
        titleAlignment: 'left'
    });

export { environmentCreationErrorFactory, environmentErrorMessageFactory };
//# sourceMappingURL=error-message-factories.mjs.map
