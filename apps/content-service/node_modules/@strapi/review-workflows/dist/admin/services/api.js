'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');

const reviewWorkflowsApi = strapiAdmin.adminApi.enhanceEndpoints({
    addTagTypes: [
        'ReviewWorkflow',
        'ReviewWorkflowStages',
        'Document',
        'ContentTypeSettings'
    ]
});

exports.reviewWorkflowsApi = reviewWorkflowsApi;
//# sourceMappingURL=api.js.map
