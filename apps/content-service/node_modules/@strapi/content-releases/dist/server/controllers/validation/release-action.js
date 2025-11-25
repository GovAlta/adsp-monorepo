'use strict';

var utils = require('@strapi/utils');

const RELEASE_ACTION_SCHEMA = utils.yup.object().shape({
    contentType: utils.yup.string().required(),
    entryDocumentId: utils.yup.strapiID(),
    locale: utils.yup.string(),
    type: utils.yup.string().oneOf([
        'publish',
        'unpublish'
    ]).required()
});
const RELEASE_ACTION_UPDATE_SCHEMA = utils.yup.object().shape({
    type: utils.yup.string().oneOf([
        'publish',
        'unpublish'
    ]).required()
});
const FIND_MANY_ACTIONS_PARAMS = utils.yup.object().shape({
    groupBy: utils.yup.string().oneOf([
        'action',
        'contentType',
        'locale'
    ])
});
const validateReleaseAction = utils.validateYupSchema(RELEASE_ACTION_SCHEMA);
const validateReleaseActionUpdateSchema = utils.validateYupSchema(RELEASE_ACTION_UPDATE_SCHEMA);
const validateFindManyActionsParams = utils.validateYupSchema(FIND_MANY_ACTIONS_PARAMS);

exports.validateFindManyActionsParams = validateFindManyActionsParams;
exports.validateReleaseAction = validateReleaseAction;
exports.validateReleaseActionUpdateSchema = validateReleaseActionUpdateSchema;
//# sourceMappingURL=release-action.js.map
