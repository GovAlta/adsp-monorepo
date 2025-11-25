import { runAction } from '../utils/helpers.mjs';
import action from '../environment/list/action.mjs';

function defineCloudNamespace(command, ctx) {
    const cloud = command.command('cloud').description('Manage Strapi Cloud projects');
    // Define cloud namespace aliases:
    cloud.command('environments').description('Alias for cloud environment list').action(()=>runAction('list', action)(ctx));
    return cloud;
}

export { defineCloudNamespace };
//# sourceMappingURL=command.mjs.map
