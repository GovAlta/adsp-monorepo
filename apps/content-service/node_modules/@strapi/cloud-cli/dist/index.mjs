import crypto from 'crypto';
import deployProject from './deploy-project/index.mjs';
import link from './link/index.mjs';
import login from './login/index.mjs';
import logout from './logout/index.mjs';
import createProject from './create-project/index.mjs';
export { default as createGrowthSsoTrial } from './create-growth-sso-trial/action.mjs';
import listProjects from './list-projects/index.mjs';
import listEnvironments from './environment/list/index.mjs';
import linkEnvironment from './environment/link/index.mjs';
import { getLocalConfig, saveLocalConfig } from './config/local.mjs';
import * as index from './services/index.mjs';
export { index as services };

const cli = {
    deployProject,
    link,
    login,
    logout,
    createProject,
    linkEnvironment,
    listProjects,
    listEnvironments
};
const cloudCommands = [
    deployProject,
    link,
    login,
    logout,
    linkEnvironment,
    listProjects,
    listEnvironments
];
async function initCloudCLIConfig() {
    const localConfig = await getLocalConfig();
    if (!localConfig.installId) {
        localConfig.installId = crypto.randomUUID();
    }
    await saveLocalConfig(localConfig);
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

export { buildStrapiCloudCommands, cli };
//# sourceMappingURL=index.mjs.map
