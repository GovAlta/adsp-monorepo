import workflows from './workflows.mjs';
import stages from './stages.mjs';
import stagePermissions from './stage-permissions.mjs';
import assignees from './assignees.mjs';
import reviewWorkflowsValidation from './validation.mjs';
import reviewWorkflowsMetrics from './metrics/index.mjs';
import reviewWorkflowsWeeklyMetrics from './metrics/weekly-metrics.mjs';
import documentServiceMiddleware from './document-service-middleware.mjs';
import homepage from '../homepage/index.mjs';

var services = {
    workflows,
    stages,
    'stage-permissions': stagePermissions,
    assignees,
    validation: reviewWorkflowsValidation,
    'document-service-middlewares': documentServiceMiddleware,
    'workflow-metrics': reviewWorkflowsMetrics,
    'workflow-weekly-metrics': reviewWorkflowsWeeklyMetrics,
    ...homepage.services
};

export { services as default };
//# sourceMappingURL=index.mjs.map
