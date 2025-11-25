import { defineCloudNamespace } from '../cloud/command.mjs';

let environmentCmd = null;
const initializeEnvironmentCommand = (command, ctx)=>{
    if (!environmentCmd) {
        const cloud = defineCloudNamespace(command, ctx);
        environmentCmd = cloud.command('environment').description('Manage environments');
    }
    return environmentCmd;
};

export { initializeEnvironmentCommand };
//# sourceMappingURL=command.mjs.map
