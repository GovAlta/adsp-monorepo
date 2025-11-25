import { Command } from 'commander';
import 'axios';
import 'fs-extra';
import 'os';
import './config/api.mjs';
import 'path';
import 'xdg-app-paths';
import { setContext, getContext } from './services/context.mjs';
import 'lodash';
import 'jwks-rsa';
import 'jsonwebtoken';
import { createLogger } from './services/logger.mjs';
import { buildStrapiCloudCommands } from './index.mjs';

function loadStrapiCloudCommand(argv = process.argv, command = new Command()) {
    // Initial program setup
    command.storeOptionsAsProperties(false).allowUnknownOption(true);
    // Help command
    command.helpOption('-h, --help', 'Display help for command');
    command.addHelpCommand('help [command]', 'Display help for command');
    const cwd = process.cwd();
    const hasDebug = argv.includes('--debug');
    const hasSilent = argv.includes('--silent');
    const logger = createLogger({
        debug: hasDebug,
        silent: hasSilent,
        timestamp: false
    });
    setContext({
        user: {
            id: ''
        },
        cwd,
        logger
    });
    const ctx = getContext();
    buildStrapiCloudCommands({
        command,
        ctx,
        argv
    });
}
function runStrapiCloudCommand(argv = process.argv, command = new Command()) {
    loadStrapiCloudCommand(argv, command);
    command.parse(argv);
}

export { runStrapiCloudCommand };
//# sourceMappingURL=bin.mjs.map
