'use strict';

var index = require('./utils/index.js');
var actions = require('./config/actions.js');
var defaultStages = require('./constants/default-stages.json.js');
var defaultWorkflow = require('./constants/default-workflow.json.js');
var webhookEvents = require('./constants/webhook-events.js');

/**
 * Initialize the default workflow if there is no workflow in the database
 */ async function initDefaultWorkflow() {
    const workflowsService = index.getService('workflows', {
        strapi
    });
    const stagesService = index.getService('stages', {
        strapi
    });
    const wfCount = await workflowsService.count();
    const stagesCount = await stagesService.count();
    // Check if there is nothing about review-workflow in DB
    // If any, the feature has already been initialized with a workflow and stages
    if (wfCount === 0 && stagesCount === 0) {
        const workflow = {
            ...defaultWorkflow.default,
            contentTypes: [],
            stages: defaultStages
        };
        await workflowsService.create({
            data: workflow
        });
    }
}
/**
 * Webhook store limits the events that can be triggered,
 * this function extends it with the events review workflows can trigger
 */ const registerWebhookEvents = async ()=>Object.entries(webhookEvents.default).forEach(([eventKey, event])=>strapi.get('webhookStore').addAllowedEvent(eventKey, event));
var bootstrap = (async (args)=>{
    // Permissions
    const { actionProvider } = index.getAdminService('permission');
    await actionProvider.registerMany(actions.reviewWorkflows);
    // Webhooks and events
    await registerWebhookEvents();
    await index.getService('workflow-weekly-metrics').registerCron();
    // Data initialization
    await initDefaultWorkflow();
    // Document service middleware
    const docsMiddlewares = index.getService('document-service-middlewares');
    strapi.documents.use(docsMiddlewares.assignStageOnCreate);
    strapi.documents.use(docsMiddlewares.handleStageOnUpdate);
    strapi.documents.use(docsMiddlewares.checkStageBeforePublish);
});

module.exports = bootstrap;
//# sourceMappingURL=bootstrap.js.map
