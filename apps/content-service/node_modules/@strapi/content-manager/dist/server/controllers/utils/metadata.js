'use strict';

var strapiUtils = require('@strapi/utils');
var index = require('../../utils/index.js');

/**
 * Format a document with metadata. Making sure the metadata response is
 * correctly sanitized for the current user
 */ const formatDocumentWithMetadata = async (permissionChecker, uid, document, opts = {})=>{
    const documentMetadata = index.getService('document-metadata');
    const serviceOutput = await documentMetadata.formatDocumentWithMetadata(uid, document, opts);
    let { meta: { availableLocales, availableStatus } } = serviceOutput;
    const metadataSanitizer = permissionChecker.sanitizeOutput;
    availableLocales = await strapiUtils.async.map(availableLocales, async (localeDocument)=>metadataSanitizer(localeDocument));
    availableStatus = await strapiUtils.async.map(availableStatus, async (statusDocument)=>metadataSanitizer(statusDocument));
    return {
        ...serviceOutput,
        meta: {
            availableLocales,
            availableStatus
        }
    };
};

exports.formatDocumentWithMetadata = formatDocumentWithMetadata;
//# sourceMappingURL=metadata.js.map
