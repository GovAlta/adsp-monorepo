import workflows from './workflows.mjs';
import stages from './stages.mjs';
import assignees from './assignees.mjs';
import homepage from '../homepage/index.mjs';

var controllers = {
    workflows,
    stages,
    assignees,
    ...homepage.controllers
};

export { controllers as default };
//# sourceMappingURL=index.mjs.map
