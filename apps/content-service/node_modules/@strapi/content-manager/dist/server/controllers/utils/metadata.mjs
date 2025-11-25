import { async } from '@strapi/utils';
import { getService } from '../../utils/index.mjs';

/**
 * Format a document with metadata. Making sure the metadata response is
 * correctly sanitized for the current user
 */ const formatDocumentWithMetadata = async (permissionChecker, uid, document, opts = {})=>{
    const documentMetadata = getService('document-metadata');
    const serviceOutput = await documentMetadata.formatDocumentWithMetadata(uid, document, opts);
    let { meta: { availableLocales, availableStatus } } = serviceOutput;
    const metadataSanitizer = permissionChecker.sanitizeOutput;
    availableLocales = await async.map(availableLocales, async (localeDocument)=>metadataSanitizer(localeDocument));
    availableStatus = await async.map(availableStatus, async (statusDocument)=>metadataSanitizer(statusDocument));
    return {
        ...serviceOutput,
        meta: {
            availableLocales,
            availableStatus
        }
    };
};

export { formatDocumentWithMetadata };
//# sourceMappingURL=metadata.mjs.map
