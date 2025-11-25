'use strict';

var utils = require('@strapi/utils');

const RELEASE_SCHEMA = utils.yup.object().shape({
    name: utils.yup.string().trim().required(),
    scheduledAt: utils.yup.string().nullable(),
    timezone: utils.yup.string().when('scheduledAt', {
        is: (value)=>value !== null && value !== undefined,
        then: utils.yup.string().required(),
        otherwise: utils.yup.string().nullable()
    })
}).required().noUnknown();
const FIND_BY_DOCUMENT_ATTACHED_PARAMS_SCHEMA = utils.yup.object().shape({
    contentType: utils.yup.string().required(),
    entryDocumentId: utils.yup.string().nullable(),
    hasEntryAttached: utils.yup.string().nullable(),
    locale: utils.yup.string().nullable()
}).required().noUnknown();
const validateRelease = utils.validateYupSchema(RELEASE_SCHEMA);
const validatefindByDocumentAttachedParams = utils.validateYupSchema(FIND_BY_DOCUMENT_ATTACHED_PARAMS_SCHEMA);

exports.RELEASE_SCHEMA = RELEASE_SCHEMA;
exports.validateRelease = validateRelease;
exports.validatefindByDocumentAttachedParams = validatefindByDocumentAttachedParams;
//# sourceMappingURL=release.js.map
