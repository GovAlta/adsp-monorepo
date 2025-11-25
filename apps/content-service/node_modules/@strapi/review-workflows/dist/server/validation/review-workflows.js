'use strict';

var utils = require('@strapi/utils');
var reviewWorkflows = require('../utils/review-workflows.js');
var workflows = require('../constants/workflows.js');

const stageObject = utils.yup.object().shape({
    id: utils.yup.number().integer().min(1),
    name: utils.yup.string().max(255).required(),
    color: utils.yup.string().matches(/^#(?:[0-9a-fA-F]{3}){1,2}$/i),
    permissions: utils.yup.array().of(utils.yup.object().shape({
        role: utils.yup.number().integer().min(1).required(),
        action: utils.yup.string().oneOf([
            workflows.STAGE_TRANSITION_UID
        ]).required(),
        actionParameters: utils.yup.object().shape({
            from: utils.yup.number().integer().min(1).required(),
            to: utils.yup.number().integer().min(1)
        })
    }))
});
const validateUpdateStageOnEntitySchema = utils.yup.object().shape({
    id: utils.yup.number().integer().min(1).required()
}).required();
const validateContentTypes = utils.yup.array().of(utils.yup.string().test({
    name: 'content-type-exists',
    message: (value)=>`Content type ${value.originalValue} does not exist`,
    test (uid) {
        // Warning; we use the strapi global - to avoid that, it would need to refactor how
        // we generate validation function by using a factory with the strapi instance as parameter.
        return !!strapi.getModel(uid);
    }
}).test({
    name: 'content-type-review-workflow-enabled',
    message: (value)=>`Content type ${value.originalValue} does not have review workflow enabled`,
    test (uid) {
        const model = strapi.getModel(uid);
        // It's not a valid content type if it doesn't have the stage attribute
        return reviewWorkflows.hasStageAttribute(model);
    }
}));
const validateWorkflowCreateSchema = utils.yup.object().shape({
    name: utils.yup.string().max(255).min(1, 'Workflow name can not be empty').required(),
    stages: utils.yup.array().of(stageObject)// @ts-expect-error - add unique property into the yup namespace typing
    .uniqueProperty('name', 'Stage name must be unique').min(1, 'Can not create a workflow without stages').max(200, 'Can not have more than 200 stages').required('Can not create a workflow without stages'),
    contentTypes: validateContentTypes,
    stageRequiredToPublishName: utils.yup.string().min(1).nullable()
});
const validateWorkflowUpdateSchema = utils.yup.object().shape({
    name: utils.yup.string().max(255).min(1, 'Workflow name can not be empty'),
    stages: utils.yup.array().of(stageObject)// @ts-expect-error - add unique property into the yup namespace typing
    .uniqueProperty('name', 'Stage name must be unique').min(1, 'Can not update a workflow without stages').max(200, 'Can not have more than 200 stages'),
    contentTypes: validateContentTypes,
    stageRequiredToPublishName: utils.yup.string().min(1).nullable()
});
const validateUpdateAssigneeOnEntitySchema = utils.yup.object().shape({
    id: utils.yup.number().integer().min(1).nullable()
}).required();
const validateLocaleSchema = utils.yup.string().nullable();
const validateWorkflowCreate = utils.validateYupSchema(validateWorkflowCreateSchema);
const validateUpdateStageOnEntity = utils.validateYupSchema(validateUpdateStageOnEntitySchema);
const validateUpdateAssigneeOnEntity = utils.validateYupSchema(validateUpdateAssigneeOnEntitySchema);
const validateWorkflowUpdate = utils.validateYupSchema(validateWorkflowUpdateSchema);
const validateLocale = utils.validateYupSchema(validateLocaleSchema);

exports.validateLocale = validateLocale;
exports.validateUpdateAssigneeOnEntity = validateUpdateAssigneeOnEntity;
exports.validateUpdateStageOnEntity = validateUpdateStageOnEntity;
exports.validateWorkflowCreate = validateWorkflowCreate;
exports.validateWorkflowUpdate = validateWorkflowUpdate;
//# sourceMappingURL=review-workflows.js.map
